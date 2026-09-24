import React, { useState, useEffect, useCallback } from 'react';
import { CapCutHomeView } from './components/CapCutHomeView';
import { CapCutEditorView } from './components/CapCutEditorView';
import { HelpModal } from './components/HelpModal';
import { LicenseModal } from './components/LicenseModal';
import { LockScreenGate } from './components/LockScreenGate';
import { Project, GeminiModelOption, RegionROI, AppSettings, VideoClip } from './types';
import { getSavedProjects, saveProject, deleteProject } from './utils/projectStorage';
import { getAppSettings, saveAppSettings } from './utils/settingsStorage';
import { initStorageDB, getAllProjectsFromDB, storeMediaFileDB, getMediaFileUrlDB, cacheRemoteVideoToDB, deleteProjectFromDB } from './utils/idbStorage';
import { getCurrentLicenseState, ensureAndSyncDeviceLicense, subscribeLicenseState, syncVerifyLicense, LicenseState, isWhitelistedAdminMember } from './utils/licenseManager';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'editor'>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => getAppSettings());
  const [selectedModel, setSelectedModel] = useState<GeminiModelOption>(appSettings.selectedModel);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState<boolean>(false);
  const [licenseState, setLicenseState] = useState<LicenseState | null>(() => {
    try {
      const raw = localStorage.getItem('bach_active_license_state_v3');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  });
  const [isLicenseLoaded, setIsLicenseLoaded] = useState<boolean>(false);

  // Helper to restore video URLs from IndexedDB for projects where object URLs are expired or missing
  const restoreProjectVideoUrls = async (projList: Project[]): Promise<Project[]> => {
    return Promise.all(
      projList.map(async (p) => {
        let updatedClips = p.clips;
        if (p.clips && p.clips.length > 0) {
          updatedClips = await Promise.all(
            p.clips.map(async (clip) => {
              const restoredUrl = await getMediaFileUrlDB(clip.id);
              if (restoredUrl) {
                return { ...clip, url: restoredUrl };
              }
              return clip;
            })
          );
        }

        let mainUrl = p.videoUrl;
        if (updatedClips && updatedClips.length > 0 && updatedClips[0].url) {
          mainUrl = updatedClips[0].url;
        } else {
          // Check IndexedDB first for permanent offline video
          const restoredUrl = await getMediaFileUrlDB(p.id);
          if (restoredUrl) {
            mainUrl = restoredUrl;
          }
        }

        return { ...p, videoUrl: mainUrl, clips: updatedClips };
      })
    );
  };

  // Initialize IndexedDB and load saved projects & settings on initial render
  useEffect(() => {
    // Initialize & auto-ensure/sync License State with server
    getCurrentLicenseState().then((st) => {
      setLicenseState(st);
      setIsLicenseLoaded(true);
    });
    const unsubscribeLicense = subscribeLicenseState((st) => {
      setLicenseState(st);
      setIsLicenseLoaded(true);
    });
    ensureAndSyncDeviceLicense().then((st) => {
      setLicenseState(st);
      setIsLicenseLoaded(true);
    }).catch(() => {
      setIsLicenseLoaded(true);
    });

    initStorageDB().then(async ({ projects: dbProjects, settings: dbSettings }) => {
      console.log('[App] initStorageDB loaded projects count:', dbProjects?.length);
      const restored = await restoreProjectVideoUrls(dbProjects);
      setProjects(restored);
      if (dbSettings) {
        setAppSettings(dbSettings);
        setSelectedModel(dbSettings.selectedModel);
      }
    }).catch(async (err) => {
      console.warn('IndexedDB initialization warning, fallback to localStorage:', err);
      const saved = getSavedProjects();
      const restored = await restoreProjectVideoUrls(saved);
      setProjects(restored);
    });

    return () => {
      unsubscribeLicense();
    };
  }, []);

  const handleSaveSettings = useCallback((newSettings: AppSettings) => {
    setAppSettings(newSettings);
    saveAppSettings(newSettings);
    setSelectedModel(newSettings.selectedModel);
  }, []);

  const handleSelectModel = (model: GeminiModelOption) => {
    setSelectedModel(model);
    const updated = { ...appSettings, selectedModel: model };
    setAppSettings(updated);
    saveAppSettings(updated);
  };

  // Open existing project
  const handleOpenProject = async (project: Project) => {
    const restoredList = await restoreProjectVideoUrls([project]);
    const restoredProj = restoredList[0] || project;
    setActiveProject(restoredProj);
    setCurrentView('editor');
  };

  // Create new project
  const handleCreateNewProject = async (
    videoUrl: string,
    title?: string,
    roi?: RegionROI,
    videoFile?: File,
    clips?: VideoClip[]
  ) => {
    const projId = `proj-${Date.now()}`;
    let finalUrl = videoUrl;

    if (videoFile) {
      console.log(`[App] Storing uploaded video file to IndexedDB for project ${projId}...`);
      const storedUrl = await storeMediaFileDB(projId, videoFile);
      if (storedUrl) finalUrl = storedUrl;
    } else if (finalUrl && !finalUrl.startsWith('blob:') && !finalUrl.startsWith('data:')) {
      // Automatically cache remote video in the background so it never dies when TikTok/Douyin CDN tokens expire
      cacheRemoteVideoToDB(projId, finalUrl).then(async (cachedLocalUrl) => {
        if (cachedLocalUrl) {
          console.log(`[App] Remote video successfully cached into IndexedDB for project ${projId}`);
          setProjects((prev) =>
            prev.map((p) => (p.id === projId ? { ...p, videoUrl: cachedLocalUrl } : p))
          );
          setActiveProject((prev) => (prev && prev.id === projId ? { ...prev, videoUrl: cachedLocalUrl } : prev));
        }
      });
    }

    const totalDuration = clips && clips.length > 0
      ? clips.reduce((sum, c) => sum + c.duration, 0)
      : 0;

    const newProj: Project = {
      id: projId,
      title: title || 'Dự án video mới',
      videoUrl: finalUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      duration: totalDuration,
      subtitles: [],
      roi: roi || { x: 10, y: 76, width: 80, height: 20 },
      targetLang: appSettings.targetLang || 'Tiếng Việt',
      styleConfig: {
        fontSize: 20,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        padding: 6,
        position: 'bottom',
        bottomOffsetPercentage: 10,
        maskOriginalSubtitles: false,
        maskColor: 'rgba(0,0,0,0.35)',
        textOutline: true,
        outlineColor: '#000000',
        hasBackground: false,
      },
      blurOverlays: [],
      logoOverlays: [],
      textOverlays: [],
      videoVolume: 1.0,
      videoSpeed: 1.0,
      clips: clips,
    };

    saveProject(newProj);
    const updatedList = await getAllProjectsFromDB();
    const listToRestore = updatedList && updatedList.length > 0 ? updatedList : [newProj, ...projects];
    const restored = await restoreProjectVideoUrls(listToRestore);
    setProjects(restored);

    setActiveProject(newProj);
    setCurrentView('editor');
  };

  // Save changes to project
  const handleSaveProject = useCallback((updatedProject: Project) => {
    saveProject(updatedProject);
    getAllProjectsFromDB().then(async (updatedList) => {
      const listToUse = updatedList && updatedList.length > 0 ? updatedList : getSavedProjects();
      const restored = await restoreProjectVideoUrls(listToUse);
      setProjects(restored);
    });
    setActiveProject(updatedProject);
  }, []);

  // Delete project
  const handleDeleteProject = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa dự án này?')) {
      const remainingLS = deleteProject(id);
      setProjects(remainingLS);

      if (activeProject?.id === id) {
        setActiveProject(null);
        setCurrentView('home');
      }

      const updatedDB = await deleteProjectFromDB(id);
      const restored = await restoreProjectVideoUrls(updatedDB);
      setProjects(restored);
    }
  };


  // Check if interface should be completely locked due to lack of valid/active license or time expiration
  const isLicenseValid = Boolean(
    isWhitelistedAdminMember(licenseState) ||
    (
      licenseState &&
      (
        licenseState.isAdmin ||
        licenseState.role === 'admin' ||
        licenseState.isWhitelistedAdmin ||
        (
          licenseState.isPro &&
          licenseState.status === 'active' &&
          (!licenseState.expiresAt || licenseState.expiresAt > Date.now() || (licenseState.remainingDays !== undefined && licenseState.remainingDays > 0))
        )
      )
    )
  );

  return (
    <>
      {!isLicenseValid ? (
        <LockScreenGate
          licenseState={licenseState}
          onOpenAdmin={() => setIsLicenseOpen(true)}
          onLicenseUpdated={(st) => setLicenseState(st)}
        />
      ) : currentView === 'home' || !activeProject ? (
        <CapCutHomeView
          projects={projects}
          onOpenProject={handleOpenProject}
          onCreateNewProject={handleCreateNewProject}
          onDeleteProject={handleDeleteProject}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          onOpenHelp={() => setIsHelpOpen(true)}
          appSettings={appSettings}
          onSaveSettings={handleSaveSettings}
          licenseState={licenseState}
          onOpenLicense={() => setIsLicenseOpen(true)}
        />
      ) : (
        <CapCutEditorView
          key={activeProject.id}
          project={activeProject}
          onBackToHome={async () => {
            const updatedList = await getAllProjectsFromDB();
            const listToUse = updatedList && updatedList.length > 0 ? updatedList : getSavedProjects();
            const restored = await restoreProjectVideoUrls(listToUse);
            setProjects(restored);
            setCurrentView('home');
          }}
          onSaveProject={handleSaveProject}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          appSettings={appSettings}
          onSaveSettings={handleSaveSettings}
          licenseState={licenseState}
          onOpenLicense={() => setIsLicenseOpen(true)}
        />
      )}

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <LicenseModal isOpen={isLicenseOpen} onClose={() => setIsLicenseOpen(false)} />
    </>
  );
}
