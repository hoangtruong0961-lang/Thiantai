import React, { useState, useEffect } from 'react';
import {
  Crop,
  Languages,
  Volume2,
  SlidersHorizontal,
  Plus,
  PlusCircle,
  Headphones,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Edit3,
  Palette,
  Trash2,
  Type,
  Check,
  Sparkles,
  Camera,
  Play,
  Mic,
  Sliders,
  Loader2,
  Merge,
  VolumeX,
  Settings,
  RefreshCw,
  Filter,
  Search,
  Layers,
  Image,
  Scissors,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Captions,
  Music2,
  Upload,
  Gauge,
  HelpCircle,
  Download,
  FileText,
  FileAudio,
  Globe,
  EyeOff,
  Square,
} from 'lucide-react';
import {
  CapCutTab,
  GeminiModelOption,
  RegionROI,
  SubtitleItem,
  SubtitleStyleConfig,
  OCRScanProgress,
  AppSettings,
  TTSProviderOption,
  BlurOverlay,
  LogoOverlay,
  TextOverlay,
  GlobalMovieContext,
  GlossaryEntity,
} from '../types';
import { SUPPORTED_LANGUAGES } from '../data/sampleVideos';
import { SubtitleStylingPanel } from './SubtitleStylingPanel';
import { wrapSubtitleText, parseSRT, exportToSRT, exportToASS, exportToVTT, exportToTXT } from '../utils/srtParser';
import { generateVoiceoverWav } from '../utils/audioExporter';
import { cleanTranslatedSubtitleText } from '../utils/subtitleCleaner';

interface CapCutBottomBarProps {
  activeTab: CapCutTab | null;
  onSelectTab: (tab: CapCutTab | null) => void;
  // Selected Video Block state
  isVideoSelected?: boolean;
  onSelectVideoBlock?: (selected: boolean) => void;
  onOpenImportModal?: () => void;
  videoVolume?: number;
  onChangeVideoVolume?: (vol: number) => void;
  videoSpeed?: number;
  onChangeVideoSpeed?: (speed: number) => void;
  // Selected Subtitle Block state
  selectedSubtitle: SubtitleItem | null;
  onSelectSubtitle: (sub: SubtitleItem | null) => void;
  onUpdateSubtitle: (updated: SubtitleItem) => void;
  onDeleteSubtitle: (id: string) => void;
  // Selected Audio Block state
  selectedAudio?: SubtitleItem | null;
  onSelectAudio?: (sub: SubtitleItem | null) => void;
  onUpdateAudioVolume?: (subId: string, volume: number) => void;
  // Extract actions
  onExtractSingleFrame: () => void;
  isExtractingSingle: boolean;
  onStartFullScan: (startTime: number, endTime: number, interval: number, customContext: string) => void;
  scanProgress: OCRScanProgress;
  onCancelScan: () => void;
  videoDuration: number;
  // STT (Speech-to-Text) actions
  onStartCapCutStt?: (options: {
    language: string;
    autoTranslateToVietnamese: boolean;
    range: 'full' | 'range';
    startTime: number;
    endTime: number;
    mode: 'replace' | 'append';
  }) => void;
  isSttRunning?: boolean;
  sttProgress?: { status: string; percentage: number; message: string };
  onCancelStt?: () => void;
  // Translate actions
  targetLang: string;
  onSelectTargetLang: (lang: string) => void;
  selectedModel: GeminiModelOption;
  onSelectModel: (model: GeminiModelOption) => void;
  onReTranslateAll: (overrideModel?: GeminiModelOption, optimizeForTts?: boolean, customContext?: string) => void;
  isTranslatingBatch: boolean;
  translationProgressMsg?: string;
  // Audio TTS actions
  activeSubtitle?: SubtitleItem | null;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onPlayTTS: (text: string, speed?: number, pitch?: number, providerOverride?: TTSProviderOption, voiceOverride?: string) => void;
  onMergeShortSubtitles: () => void;
  onGenerateAllAudio: () => void;
  isGeneratingAllAudio: boolean;
  audioGenProgress: { current: number; total: number };
  audioPlayWithVideo: boolean;
  onToggleAudioPlayWithVideo: (val: boolean) => void;
  onClearAllAudio: () => void;
  // Subtitles & Styling
  subtitles: SubtitleItem[];
  onAddSubtitle: () => void;
  styleConfig: SubtitleStyleConfig;
  onChangeStyle: (newStyle: SubtitleStyleConfig) => void;
  // Single Audio Generation for selected subtitle
  onGenerateSingleAudio?: (subId: string) => void;
  isGeneratingSingleAudio?: string | null;
  onPlaySingleAudio?: (sub: SubtitleItem) => void;
  onDeleteSingleAudio?: (subId: string) => void;
  // ROI presets
  onChangeRoi: (roi: RegionROI) => void;
  onOpenConfigDrawer?: () => void;
  onReScanSubtitle?: (sub: SubtitleItem) => void;
  onUpdateSubtitles?: (updated: SubtitleItem[]) => void;
  blurOverlays?: BlurOverlay[];
  onChangeBlurOverlays?: (overlays: BlurOverlay[]) => void;
  logoOverlays?: LogoOverlay[];
  onChangeLogoOverlays?: (overlays: LogoOverlay[]) => void;
  textOverlays?: TextOverlay[];
  onChangeTextOverlays?: (overlays: TextOverlay[]) => void;
  showBlurVirtualBorder?: boolean;
  onToggleBlurVirtualBorder?: (val: boolean) => void;
  selectedBlurOverlayId?: string | null;
  onSelectBlurOverlay?: (id: string | null) => void;
  customContext?: string;
  globalContext?: GlobalMovieContext | null;
  // Text Overlay & Media Import
  currentTime?: number;
  onImportSRT?: (file: File) => void;
  onImportAudio?: (file: File) => void;
  onImportBgMusic?: (file: File) => void;
  bgMusicTitle?: string;
  selectedTextOverlayId?: string | null;
  onSelectTextOverlay?: (overlay: TextOverlay | null) => void;
  triggerTextOverlayAction?: { id: string; action: 'edit' | 'config' } | null;
  projectTitle?: string;
}

export const CapCutBottomBar: React.FC<CapCutBottomBarProps> = ({
  activeTab,
  onSelectTab,
  isVideoSelected = false,
  onSelectVideoBlock,
  onOpenImportModal,
  projectTitle,
  videoVolume = 1.0,
  onChangeVideoVolume,
  videoSpeed = 1.0,
  onChangeVideoSpeed,
  selectedSubtitle,
  onSelectSubtitle,
  onUpdateSubtitle,
  onDeleteSubtitle,
  selectedAudio = null,
  onSelectAudio,
  onUpdateAudioVolume,
  onExtractSingleFrame,
  isExtractingSingle,
  onStartFullScan,
  scanProgress,
  onCancelScan,
  videoDuration,
  onStartCapCutStt,
  isSttRunning = false,
  sttProgress = { status: 'idle', percentage: 0, message: '' },
  onCancelStt,
  targetLang,
  onSelectTargetLang,
  selectedModel,
  onSelectModel,
  onReTranslateAll,
  isTranslatingBatch,
  translationProgressMsg,
  activeSubtitle,
  appSettings,
  onSaveSettings,
  onPlayTTS,
  onMergeShortSubtitles,
  onGenerateAllAudio,
  isGeneratingAllAudio,
  audioGenProgress,
  audioPlayWithVideo,
  onToggleAudioPlayWithVideo,
  onClearAllAudio,
  subtitles,
  onAddSubtitle,
  styleConfig,
  onChangeStyle,
  onGenerateSingleAudio,
  isGeneratingSingleAudio,
  onPlaySingleAudio,
  onDeleteSingleAudio,
  onChangeRoi,
  onOpenConfigDrawer,
  onReScanSubtitle,
  onUpdateSubtitles,
  blurOverlays = [],
  onChangeBlurOverlays,
  showBlurVirtualBorder = true,
  onToggleBlurVirtualBorder,
  selectedBlurOverlayId = null,
  onSelectBlurOverlay,
  logoOverlays = [],
  onChangeLogoOverlays,
  textOverlays = [],
  onChangeTextOverlays,
  customContext = '',
  globalContext = null,
  currentTime = 0,
  onImportSRT,
  onImportAudio,
  onImportBgMusic,
  bgMusicTitle,
  selectedTextOverlayId = null,
  onSelectTextOverlay,
  triggerTextOverlayAction = null,
}) => {
  // Navigation Groups: 'subtitles' (Phụ đề), 'audio' (Âm thanh), 'text' (Văn bản), or null (main bottom bar)
  const [activeGroup, setActiveGroup] = useState<'subtitles' | 'audio' | 'text' | null>(null);

  // Hidden File Input Refs for Bottom Toolbar
  const srtFileInputRef = React.useRef<HTMLInputElement>(null);
  const audioFileInputRef = React.useRef<HTMLInputElement>(null);
  const bgMusicFileInputRef = React.useRef<HTMLInputElement>(null);

  const [scanStart, setScanStart] = useState<number>(0);
  const [scanEnd, setScanEnd] = useState<number>(Math.min(300, Math.ceil(videoDuration) || 60));
  const [scanInterval, setScanInterval] = useState<number>(() => {
    if (appSettings?.ocrInterval) return appSettings.ocrInterval;
    return videoDuration > 300 ? 0.8 : 0.6;
  });
  const [contextPrompt, setContextPrompt] = useState<string>(customContext || '');
  const [showTranslationContext, setShowTranslationContext] = useState<boolean>(false);

  // Local state for CapCut Speech-to-Text (STT)
  const [sttLanguage, setSttLanguage] = useState<string>('zh-CN');
  const [sttAutoTranslate, setSttAutoTranslate] = useState<boolean>(true);
  const [sttRange, setSttRange] = useState<'full' | 'range'>('full');
  const [sttStartTime, setSttStartTime] = useState<number>(0);
  const [sttEndTime, setSttEndTime] = useState<number>(() => Math.ceil(videoDuration) || 60);
  const [sttMode, setSttMode] = useState<'replace' | 'append'>('replace');
  const [isSttLangExpanded, setIsSttLangExpanded] = useState<boolean>(false);

  // Subtitle Export & Audio Export States
  const [showSubtitleExportModal, setShowSubtitleExportModal] = useState<boolean>(false);
  const [isExportingAudio, setIsExportingAudio] = useState<boolean>(false);
  const [audioExportSuccess, setAudioExportSuccess] = useState<string | null>(null);

  const cleanProjectTitle = (projectTitle || 'capcut_project').replace(/\.\w+$/, '');

  const downloadTextContent = (content: string, filename: string, mimeType: string = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSubtitleFile = (type: 'srt_trans' | 'srt_orig' | 'ass' | 'vtt' | 'txt') => {
    if (!subtitles || subtitles.length === 0) {
      alert('Chưa có dòng phụ đề nào để xuất.');
      return;
    }
    if (type === 'srt_trans') {
      const content = exportToSRT(subtitles, 'translated');
      downloadTextContent(content, `${cleanProjectTitle}_translated.srt`);
    } else if (type === 'srt_orig') {
      const content = exportToSRT(subtitles, 'original');
      downloadTextContent(content, `${cleanProjectTitle}_original.srt`);
    } else if (type === 'ass') {
      const content = exportToASS(subtitles, styleConfig, 'translated', 1280, 720);
      downloadTextContent(content, `${cleanProjectTitle}_style.ass`);
    } else if (type === 'vtt') {
      const content = exportToVTT(subtitles, 'translated');
      downloadTextContent(content, `${cleanProjectTitle}.vtt`, 'text/vtt;charset=utf-8');
    } else if (type === 'txt') {
      const content = exportToTXT(subtitles, 'translated');
      downloadTextContent(content, `${cleanProjectTitle}_script.txt`);
    }
    setShowSubtitleExportModal(false);
  };

  const handleExportVoiceoverAudio = async () => {
    if (!subtitles || subtitles.length === 0) {
      alert('Không có phụ đề để tạo âm thanh thuyết minh.');
      return;
    }
    setIsExportingAudio(true);
    setAudioExportSuccess(null);
    try {
      const result = await generateVoiceoverWav(
        subtitles,
        videoDuration,
        appSettings?.ttsSpeed || 1.0,
        appSettings?.ttsPitch || 0
      );
      const actualBlob = (result as any)?.blob || result;
      if (!actualBlob || actualBlob.size === 0) {
        alert('Chưa có âm thanh TTS nào được sinh ra. Vui lòng bấm "Tạo tất cả" để tạo giọng đọc trước khi xuất.');
        return;
      }
      const url = URL.createObjectURL(actualBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanProjectTitle}_voiceover.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setAudioExportSuccess('Đã xuất thành công file âm thanh thuyết minh WAV!');
      setTimeout(() => setAudioExportSuccess(null), 4000);
    } catch (err: any) {
      console.error('Lỗi khi xuất audio thuyết minh:', err);
      alert('Không thể xuất file audio: ' + (err.message || String(err)));
    } finally {
      setIsExportingAudio(false);
    }
  };

  useEffect(() => {
    if (videoDuration && videoDuration > 0) {
      setSttEndTime(Math.ceil(videoDuration));
    }
  }, [videoDuration]);

  useEffect(() => {
    if (customContext && !contextPrompt) {
      setContextPrompt(customContext);
    }
  }, [customContext]);

  // Local state for Filter/Watermark/Overlays sub-tabs
  const [filtersSubTab, setFiltersSubTab] = useState<'text' | 'blur' | 'logo' | 'text_overlay'>('text');
  const [filterKeywords, setFilterKeywords] = useState<string>('');
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2000);
  };

  // Handlers for Text Overlays & Persistent Video Titles
  const selectedTextItem = (textOverlays || []).find((t) => t.id === selectedTextOverlayId);

  // Handlers for Blur Overlays
  const selectedBlurItem = (blurOverlays || []).find((b) => b.id === selectedBlurOverlayId);
  const [activeBlurTool, setActiveBlurTool] = useState<'blur' | 'radius' | null>(null);

  useEffect(() => {
    if (!selectedBlurItem) {
      setActiveBlurTool(null);
    }
  }, [selectedBlurItem?.id]);

  const handleCreateTextOverlay = () => {
    const sTime = Math.max(0, currentTime || 0);
    const eTime = Math.min(videoDuration || 60, sTime + 3.0);
    const newText: TextOverlay = {
      id: `text-${Date.now()}`,
      text: 'Văn bản mới',
      x: 25,
      y: 40,
      width: 50,
      height: 12,
      fontSize: 26,
      fontWeight: 'bold',
      color: '#ffffff',
      startTime: sTime,
      endTime: eTime,
      isTitle: false, // Xuất hiện trên timeline văn bản
      opacity: 100,
      textOutline: true,
      outlineColor: '#000000',
      outlineWidth: 2,
      textAlign: 'center',
    };
    const nextList = [...(textOverlays || []), newText];
    if (onChangeTextOverlays) onChangeTextOverlays(nextList);
    if (onSelectTextOverlay) onSelectTextOverlay(newText);
    triggerToast('Đã tạo văn bản trên timeline');
  };

  const handleCreateTitleOverlay = () => {
    const newTitle: TextOverlay = {
      id: `title-${Date.now()}`,
      text: 'TIÊU ĐỀ VIDEO',
      x: 15,
      y: 8,
      width: 70,
      height: 12,
      fontSize: 32,
      fontWeight: '900',
      color: '#facc15',
      isTitle: true, // Tiêu đề mặc định luôn xuyên suốt video, không xuất hiện trên timeline văn bản
      startTime: 0,
      endTime: 999999,
      opacity: 100,
      textOutline: true,
      outlineColor: '#000000',
      outlineWidth: 3,
      textAlign: 'center',
    };
    const nextList = [...(textOverlays || []), newTitle];
    if (onChangeTextOverlays) onChangeTextOverlays(nextList);
    triggerToast('Đã thêm tiêu đề');
  };

  const updateSelectedTextOverlay = (updates: Partial<TextOverlay>) => {
    if (!selectedTextItem || !onChangeTextOverlays) return;
    const nextList = (textOverlays || []).map((t) =>
      t.id === selectedTextItem.id ? { ...t, ...updates } : t
    );
    onChangeTextOverlays(nextList);
  };

  const textOverlayStyleConfig: SubtitleStyleConfig = React.useMemo(() => {
    if (!selectedTextItem) {
      return {
        fontSize: 28,
        fontColor: '#ffffff',
        backgroundColor: '#000000',
        bgOpacity: 65,
        borderRadius: 8,
        fontWeight: 'bold',
        fontStyle: 'normal',
        padding: 6,
        position: 'middle',
        bottomOffsetPercentage: 10,
        textOutline: true,
        outlineColor: '#000000',
        outlineWidth: 3,
        fontFamily: 'Be Vietnam Pro',
        hasBackground: false,
      };
    }

    if (selectedTextItem.styleConfig) {
      return selectedTextItem.styleConfig;
    }

    const opacityVal = selectedTextItem.backgroundOpacity !== undefined
      ? (selectedTextItem.backgroundOpacity > 1 ? selectedTextItem.backgroundOpacity : Math.round(selectedTextItem.backgroundOpacity * 100))
      : 65;

    return {
      fontSize: selectedTextItem.fontSize || 28,
      fontColor: selectedTextItem.color || (selectedTextItem.isTitle ? '#facc15' : '#ffffff'),
      backgroundColor: selectedTextItem.backgroundColor || '#000000',
      bgOpacity: opacityVal,
      borderRadius: selectedTextItem.borderRadius || 8,
      fontWeight: selectedTextItem.fontWeight === 'bold' || selectedTextItem.fontWeight === '800' || selectedTextItem.fontWeight === '900' ? 'bold' : 'normal',
      fontStyle: selectedTextItem.fontStyle || 'normal',
      padding: 6,
      position: 'middle',
      bottomOffsetPercentage: 10,
      textOutline: selectedTextItem.textOutline !== false,
      outlineColor: selectedTextItem.outlineColor || '#000000',
      outlineWidth: selectedTextItem.outlineWidth || 3,
      fontFamily: selectedTextItem.fontFamily || 'Be Vietnam Pro',
      hasBackground: Boolean(selectedTextItem.hasBackground),
      textShadowColor: selectedTextItem.shadowColor || '#000000',
      textShadowBlur: selectedTextItem.shadowBlur || 4,
    };
  }, [selectedTextItem]);

  const handleUpdateTextOverlayStyleConfig = (newStyle: SubtitleStyleConfig) => {
    if (!selectedTextItem || !onChangeTextOverlays) return;

    const updated: TextOverlay = {
      ...selectedTextItem,
      styleConfig: newStyle,
      fontSize: newStyle.fontSize,
      color: newStyle.fontColor,
      fontFamily: newStyle.fontFamily,
      fontWeight: newStyle.fontWeight,
      fontStyle: newStyle.fontStyle,
      hasBackground: newStyle.hasBackground,
      backgroundColor: newStyle.backgroundColor,
      backgroundOpacity: (newStyle.bgOpacity ?? 65) / 100,
      borderRadius: newStyle.borderRadius,
      textOutline: newStyle.textOutline,
      outlineColor: newStyle.outlineColor,
      outlineWidth: newStyle.outlineWidth,
      shadowColor: newStyle.textShadowColor,
      shadowBlur: newStyle.textShadowBlur,
    };

    const nextList = (textOverlays || []).map((t) => (t.id === selectedTextItem.id ? updated : t));
    onChangeTextOverlays(nextList);
  };

  const handleEditTextOverlay = () => {
    if (!selectedTextItem) return;
    setEditTextOverlayContent(selectedTextItem.text);
    setShowTextOverlayEditor(true);
    setShowTextOverlayConfig(false);
    setIsSheetCollapsed(false);
  };

  const handleOpenTextOverlayConfig = () => {
    if (!selectedTextItem) return;
    setShowTextOverlayConfig(true);
    setShowTextOverlayEditor(false);
    setIsSheetCollapsed(false);
  };

  const handleDeleteTextOverlay = () => {
    if (!selectedTextItem) return;
    const nextList = (textOverlays || []).filter((t) => t.id !== selectedTextItem.id);
    if (onChangeTextOverlays) onChangeTextOverlays(nextList);
    if (onSelectTextOverlay) onSelectTextOverlay(null);
    setShowTextOverlayEditor(false);
    setShowTextOverlayConfig(false);
    triggerToast('Đã xóa văn bản');
  };

  const handleSrtFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onImportSRT) {
        onImportSRT(file);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          if (text) {
            const parsed = parseSRT(text);
            if (parsed.length > 0 && onUpdateSubtitles) {
              onUpdateSubtitles(parsed);
              triggerToast(`Đã nhập ${parsed.length} phụ đề SRT`);
            }
          }
        };
        reader.readAsText(file);
      }
    }
    e.target.value = '';
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onImportAudio) {
        onImportAudio(file);
      }
      triggerToast(`Đã nạp audio: ${file.name}`);
    }
    e.target.value = '';
  };

  const handleBgMusicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onImportBgMusic) {
        onImportBgMusic(file);
      }
      triggerToast(`Đã chọn nhạc nền: ${file.name}`);
    }
    e.target.value = '';
  };

  const handleExecuteFilter = (mode: 'delete_sub' | 'strip_text') => {
    if (!onUpdateSubtitles) return;
    const keywords = filterKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    if (keywords.length === 0) return;

    const updated = subtitles.map(sub => {
      let originalText = sub.originalText || '';
      let translatedText = sub.translatedText || '';

      if (mode === 'strip_text') {
        keywords.forEach(kw => {
          const regex = new RegExp(kw, 'gi');
          originalText = originalText.replace(regex, '');
          translatedText = translatedText.replace(regex, '');
        });
        return {
          ...sub,
          originalText: originalText.trim(),
          translatedText: translatedText.trim(),
        };
      } else {
        const hasKeyword = keywords.some(kw => 
          originalText.toLowerCase().includes(kw) || 
          translatedText.toLowerCase().includes(kw)
        );
        return hasKeyword ? null : sub;
      }
    }).filter(Boolean) as SubtitleItem[];

    onUpdateSubtitles(updated);
    triggerToast("Đã lưu thành công");
  };

  const handleExecuteFilterSmart = () => {
    if (!onUpdateSubtitles) return;
    const keywords = filterKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    if (keywords.length === 0) return;

    const updated = subtitles.map(sub => {
      let originalText = sub.originalText || '';
      let translatedText = sub.translatedText || '';

      keywords.forEach(kw => {
        const regex = new RegExp(kw, 'gi');
        originalText = originalText.replace(regex, '');
        translatedText = translatedText.replace(regex, '');
      });

      // If both original and translated become empty, filter out this subtitle entirely
      if (!originalText.trim() && !translatedText.trim()) {
        return null;
      }

      return {
        ...sub,
        originalText: originalText.trim(),
        translatedText: translatedText.trim(),
      };
    }).filter(Boolean) as SubtitleItem[];

    onUpdateSubtitles(updated);
    triggerToast("Đã lưu thành công");
  };

  const handleFindReplace = () => {
    if (!onUpdateSubtitles || !findText) return;
    const regex = new RegExp(findText, 'gi');
    const updated = subtitles.map(sub => ({
      ...sub,
      originalText: sub.originalText.replace(regex, replaceText),
      translatedText: sub.translatedText.replace(regex, replaceText),
    }));
    onUpdateSubtitles(updated);
    triggerToast("Đã lưu thành công");
  };

  const handleCleanAllSubtitleArtifacts = () => {
    if (!onUpdateSubtitles || subtitles.length === 0) return;
    let cleanedCount = 0;
    const updated = subtitles.map((sub) => {
      const originalClean = cleanTranslatedSubtitleText(sub.originalText || '');
      const translatedClean = cleanTranslatedSubtitleText(sub.translatedText || '');
      if (originalClean !== sub.originalText || translatedClean !== sub.translatedText) {
        cleanedCount++;
      }
      return {
        ...sub,
        originalText: originalClean,
        translatedText: translatedClean,
      };
    });

    onUpdateSubtitles(updated);
    triggerToast(`Đã làm sạch ${cleanedCount} phụ đề khỏi rác/thẻ debug AI`);
    alert(`✨ Hoàn tất làm sạch:\n- Đã rà soát và làm sạch ${cleanedCount}/${subtitles.length} phụ đề\n- Loại bỏ toàn bộ các ghi chú debug ("拼写错误", "(OK)", "chars - Limit", "Correction", "平衡", mã ID...).`);
  };

  const handleSplitMultilineSubtitles = () => {
    if (!onUpdateSubtitles) return;
    const newSubs: SubtitleItem[] = [];
    let splitCount = 0;

    subtitles.forEach(sub => {
      const wrappedOrig = wrapSubtitleText(
        sub.originalText || '',
        styleConfig.orientation || 'horizontal',
        styleConfig.maxCharsHorizontal || 65,
        styleConfig.maxCharsVertical || 36
      );
      const wrappedTrans = wrapSubtitleText(
        sub.translatedText || '',
        styleConfig.orientation || 'horizontal',
        styleConfig.maxCharsHorizontal || 65,
        styleConfig.maxCharsVertical || 36
      );

      const origLines = wrappedOrig.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const transLines = wrappedTrans.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const maxLines = Math.max(origLines.length, transLines.length);

      if (maxLines > 1) {
        splitCount++;
        const duration = sub.endTime - sub.startTime;
        const segmentDuration = duration / maxLines;

        for (let index = 0; index < maxLines; index++) {
          const start = sub.startTime + index * segmentDuration;
          const end = sub.startTime + (index + 1) * segmentDuration;
          
          const origLine = origLines.length === 1 
            ? (index === 0 ? origLines[0] : '') 
            : (origLines[index] || '');
          const transLine = transLines.length === 1 
            ? (index === 0 ? transLines[0] : '') 
            : (transLines[index] || '');

          newSubs.push({
            ...sub,
            id: `${sub.id}_split_${index}_${Date.now()}`,
            startTime: parseFloat(start.toFixed(3)),
            endTime: parseFloat(end.toFixed(3)),
            originalText: origLine,
            translatedText: transLine,
            audioUrl: undefined, // Xóa cache âm thanh cũ vì chữ đã thay đổi
          });
        }
      } else {
        newSubs.push(sub);
      }
    });

    if (splitCount > 0) {
      onUpdateSubtitles(newSubs);
      alert(`Đã phát hiện và tách thành công ${splitCount} phụ đề có nhiều dòng thành các phụ đề đơn lẻ!`);
    } else {
      alert('Không tìm thấy phụ đề nào có nhiều dòng để tách.');
    }
  };

  const handleAddBlurOverlay = () => {
    const newBlur: BlurOverlay = {
      id: `blur_${Date.now()}`,
      x: 35,
      y: 35,
      width: 30,
      height: 20,
      blur: 15,
      borderRadius: 8,
    };
    if (onChangeBlurOverlays) {
      onChangeBlurOverlays([...blurOverlays, newBlur]);
    }
    if (onSelectBlurOverlay) {
      onSelectBlurOverlay(newBlur.id);
    }
    if (onSelectSubtitle) onSelectSubtitle(null);
    if (onSelectTextOverlay) onSelectTextOverlay(null);
    if (onSelectVideoBlock) onSelectVideoBlock(false);
    onSelectTab(null);
    setActiveBlurTool(null);
  };

  const handleAddLogoOverlay = (file: File) => {
    if (!onChangeLogoOverlays) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (url) {
        const newLogo: LogoOverlay = {
          id: `logo_${Date.now()}`,
          url,
          x: 10,
          y: 10,
          width: 20,
          height: 15,
          opacity: 100,
          borderRadius: 8,
        };
        onChangeLogoOverlays([...logoOverlays, newLogo]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddTextOverlay = () => {
    if (!onChangeTextOverlays) return;
    const newText: TextOverlay = {
      id: `text_${Date.now()}`,
      text: 'Chữ chèn video',
      x: 20,
      y: 20,
      width: 60,
      height: 12,
      fontSize: 28,
      fontFamily: 'Be Vietnam Pro',
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#ffffff',
      hasBackground: false,
      backgroundColor: '#000000',
      backgroundOpacity: 80,
      borderRadius: 8,
      opacity: 100,
      textAlign: 'center',
      textOutline: true,
      outlineColor: '#000000',
      outlineWidth: 2,
      textShadow: true,
      shadowColor: 'rgba(0,0,0,0.85)',
      shadowBlur: 8,
    };
    onChangeTextOverlays([...textOverlays, newText]);
  };

  // Audio TTS Local Config
  const [ttsSpeed, setTtsSpeed] = useState<number>(appSettings.ttsSpeed || 1.0);
  const [ttsPitch, setTtsPitch] = useState<number>(appSettings.ttsPitch || 0);
  const [selectedTtsProvider, setSelectedTtsProvider] = useState<TTSProviderOption>(appSettings.ttsProvider || 'capcut_tts');
  const [selectedCapcutVoice, setSelectedCapcutVoice] = useState<string>(appSettings.capcutVoice || 'BV074_streaming');
  const [autoMergeSubtitles, setAutoMergeSubtitles] = useState<boolean>(true);
  const [isTuningCollapsed, setIsTuningCollapsed] = useState<boolean>(false);
  const [isTestingTts, setIsTestingTts] = useState<boolean>(false);
  const [isCacheCleared, setIsCacheCleared] = useState<boolean>(false);

  useEffect(() => {
    if (appSettings.ttsProvider) {
      setSelectedTtsProvider(appSettings.ttsProvider);
    }
  }, [appSettings.ttsProvider]);

  useEffect(() => {
    if (appSettings.capcutVoice) {
      setSelectedCapcutVoice(appSettings.capcutVoice);
    }
  }, [appSettings.capcutVoice]);

  // Nghi TTS download & status management
  const [nghiStatus, setNghiStatus] = useState<{ ready: boolean; modelSizeMb: number; downloadedVoices: string[] } | null>(null);
  const [isDownloadingNghi, setIsDownloadingNghi] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState('');

  const checkNghiStatus = async (voiceKey: string, autoDownloadIfMissing = false) => {
    try {
      const res = await fetch('/api/tts/nghi-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nghiVoice: voiceKey }),
      });
      const rawText = await res.text().catch(() => '');
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        data = {};
      }
      if (data.success) {
        setNghiStatus(data);
        if (autoDownloadIfMissing && !data.downloadedVoices?.includes(voiceKey)) {
          handleDownloadNghiModel(voiceKey);
        }
      }
    } catch (e) {
      console.warn('Check Nghi status error:', e);
    }
  };

  const handleDownloadNghiModel = async (voiceKey: string) => {
    const voiceNameMap: Record<string, string> = {
      ngochuyennew: 'Ngọc Huyền',
      lacphi: 'Lạc Phi',
      duyoryx: 'Duy Oryx',
      ngocngan: 'Ngọc Ngạn',
      maiphuong: 'Mai Phương',
      minhquang: 'Minh Quang',
    };
    const voiceName = voiceNameMap[voiceKey] || voiceKey;

    setIsDownloadingNghi(true);
    setDownloadMsg(`⏳ Đang tải về mô hình giọng đọc ${voiceName}... Vui lòng đợi trong giây lát!`);
    try {
      const res = await fetch('/api/tts/nghi-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nghiVoice: voiceKey }),
      });
      const rawText = await res.text().catch(() => '');
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        data = {};
      }
      if (data.success) {
        setDownloadMsg(`✓ Đã tải xong giọng đọc ${voiceName}!`);
        await checkNghiStatus(voiceKey);
      } else {
        setDownloadMsg(`❌ Lỗi tải: ${data.error || rawText.slice(0, 80) || 'Không xác định'}`);
      }
    } catch (e: any) {
      setDownloadMsg(`❌ Lỗi kết nối: ${e.message}`);
    } finally {
      setIsDownloadingNghi(false);
    }
  };

  React.useEffect(() => {
    if (selectedTtsProvider === 'nghi_tts') {
      checkNghiStatus(appSettings.nghiVoice || 'lacphi', true);
    }
  }, [selectedTtsProvider, appSettings.nghiVoice]);

  // Subtitle block edit panel popups
  const [showTextEditor, setShowTextEditor] = useState<boolean>(false);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);

  // Text Overlay edit panel popups (independent from subtitle style)
  const [showTextOverlayEditor, setShowTextOverlayEditor] = useState<boolean>(false);
  const [showTextOverlayConfig, setShowTextOverlayConfig] = useState<boolean>(false);
  const [editTextOverlayContent, setEditTextOverlayContent] = useState<string>('');

  React.useEffect(() => {
    if (selectedTextItem) {
      setEditTextOverlayContent(selectedTextItem.text);
    } else {
      setShowTextOverlayEditor(false);
      setShowTextOverlayConfig(false);
    }
  }, [selectedTextItem?.id]);

  React.useEffect(() => {
    if (triggerTextOverlayAction && selectedTextItem && triggerTextOverlayAction.id === selectedTextItem.id) {
      if (triggerTextOverlayAction.action === 'edit') {
        setEditTextOverlayContent(selectedTextItem.text);
        setShowTextOverlayEditor(true);
        setShowTextOverlayConfig(false);
        setIsSheetCollapsed(false);
      } else if (triggerTextOverlayAction.action === 'config') {
        setShowTextOverlayConfig(true);
        setShowTextOverlayEditor(false);
        setIsSheetCollapsed(false);
      }
    }
  }, [triggerTextOverlayAction, selectedTextItem?.id]);

  // Video speed/volume sub-tabs
  const [activeVideoSubTab, setActiveVideoSubTab] = useState<'volume' | 'speed' | null>(null);

  React.useEffect(() => {
    if (!isVideoSelected) {
      setActiveVideoSubTab(null);
    }
  }, [isVideoSelected]);

  // Audio volume sub-tab
  const [activeAudioSubTab, setActiveAudioSubTab] = useState<'volume' | null>(null);

  React.useEffect(() => {
    if (!selectedAudio) {
      setActiveAudioSubTab(null);
    }
  }, [selectedAudio]);

  // Editable text state
  const [editTextOriginal, setEditTextOriginal] = useState<string>('');
  const [editTextTranslated, setEditTextTranslated] = useState<string>('');

  // Bottom Sheet animation & collapse/expand state ("Ngạch Ngang" handle bar)
  const [isSheetCollapsed, setIsSheetCollapsed] = useState<boolean>(false);
  const [sourceLang, setSourceLang] = useState<string>('Tiếng Trung');
  const [ocrMode, setOcrMode] = useState<'fast' | 'deep'>('fast');
  const [isOcrModeExpanded, setIsOcrModeExpanded] = useState<boolean>(false);
  const [isOcrFilterExpanded, setIsOcrFilterExpanded] = useState<boolean>(false);
  const [isOcrLangExpanded, setIsOcrLangExpanded] = useState<boolean>(false);
  const [showOcrHelpModal, setShowOcrHelpModal] = useState<boolean>(false);
  const [filterStrength, setFilterStrength] = useState<string>(
    appSettings?.bgFilterStrength ? `${appSettings.bgFilterStrength}%` : '40%'
  );

  React.useEffect(() => {
    if (typeof appSettings?.bgFilterStrength === 'number') {
      const target = `${appSettings.bgFilterStrength}%`;
      setFilterStrength((prev) => (prev !== target ? target : prev));
    }
  }, [appSettings?.bgFilterStrength]);
  const isAiRefineActive = appSettings?.autoAiRefine !== false;
  const isAdaptiveSamplingActive = appSettings?.adaptiveSampling !== false;
  const [optimizeForTts, setOptimizeForTts] = useState<boolean>(true);

  const handleToggleAiRefine = (enabled: boolean) => {
    if (onSaveSettings) {
      onSaveSettings({
        ...appSettings,
        autoAiRefine: enabled,
      });
    }
  };

  const handleToggleAdaptiveSampling = (enabled: boolean) => {
    if (onSaveSettings) {
      onSaveSettings({
        ...appSettings,
        adaptiveSampling: enabled,
      });
    }
  };

  React.useEffect(() => {
    if (activeTab || showTextEditor || showConfigPanel || activeVideoSubTab || activeAudioSubTab) {
      setIsSheetCollapsed((prev) => (prev ? false : prev));
    }
  }, [activeTab, showTextEditor, showConfigPanel, activeVideoSubTab, activeAudioSubTab]);

  const isScanning = scanProgress.status === 'scanning' || scanProgress.status === 'translating';

  // Open text edit modal
  const handleOpenTextEditor = () => {
    if (selectedSubtitle) {
      setEditTextOriginal(selectedSubtitle.originalText || '');
      setEditTextTranslated(selectedSubtitle.translatedText || '');
      setShowTextEditor(true);
      setShowConfigPanel(false);
    }
  };

  const handleSaveTextEditor = () => {
    if (selectedSubtitle) {
      onUpdateSubtitle({
        ...selectedSubtitle,
        originalText: editTextOriginal,
        translatedText: editTextTranslated,
      });
      setShowTextEditor(false);
    }
  };

  const activeSheetType = selectedSubtitle && showTextEditor
    ? 'text_editor'
    : selectedTextItem && showTextOverlayEditor
    ? 'text_overlay_editor'
    : selectedTextItem && showTextOverlayConfig
    ? 'text_overlay_config'
    : (showConfigPanel || activeTab === 'config' || activeTab === 'style')
    ? 'config'
    : selectedAudio && activeAudioSubTab === 'volume'
    ? 'audio_volume'
    : activeVideoSubTab === 'volume'
    ? 'video_volume'
    : activeVideoSubTab === 'speed'
    ? 'video_speed'
    : selectedBlurItem
    ? null
    : (activeTab === 'overlays' && filtersSubTab === 'blur')
    ? null
    : activeTab && !selectedSubtitle && !selectedAudio
    ? activeTab
    : null;

  return (
    <div className={`bg-[#0e0e13] border-t border-zinc-800/80 shadow-2xl flex flex-col justify-center relative select-none flex-shrink-0 h-[62px] min-h-[62px] max-h-[62px] rounded-none overflow-hidden ${
      activeSheetType && !isSheetCollapsed ? 'z-[210]' : 'z-30'
    }`}>
      {/* ------------------------------------------------------------- */}
      {/* UNIFIED SLIDE-UP BOTTOM SHEET FOR ALL BOTTOM TAB / BLOCK ACTIONS */}
      {/* ------------------------------------------------------------- */}
      {activeSheetType && (
        <React.Fragment>
          {/* Backdrop (Fades out when collapsed so user can interact with video/OCR) */}
          <div
            onClick={() => {
              onSelectTab(null);
              setShowTextEditor(false);
              setShowConfigPanel(false);
              setActiveAudioSubTab(null);
              setActiveVideoSubTab(null);
            }}
            className={`fixed inset-0 bg-black/70 z-[190] transition-opacity duration-300 ${
              isSheetCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 backdrop-blur-xs'
            }`}
          />

          {/* Slide-Up Container */}
          <div
            className={`fixed inset-x-0 bottom-0 z-[200] max-w-md mx-auto bg-[#18181c] border-t border-slate-800 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out flex flex-col max-h-[80vh] ${
              isSheetCollapsed ? 'translate-y-[calc(100%-3.25rem)]' : 'translate-y-0'
            }`}
          >
            {/* Top Horizontal Drag Handle Bar ("Ngạch Ngang") */}
            <div
              onClick={() => setIsSheetCollapsed(!isSheetCollapsed)}
              className="w-full pt-2.5 pb-1 flex flex-col items-center justify-center cursor-pointer select-none group active:scale-95 transition-transform"
              title={isSheetCollapsed ? 'Nhấp vào đây để trồi UI lên' : 'Nhấp ngạch ngang để trồi UI xuống xem video & chỉnh OCR'}
            >
              <div className="w-12 h-1.5 bg-slate-600 group-hover:bg-sky-400 rounded-full transition-colors shadow-sm" />
              {isSheetCollapsed && (
                <div className="flex items-center space-x-1.5 text-xs text-sky-400 font-bold mt-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Trồi UI Lên (Kéo/Chỉnh vùng OCR ở video phía trên)</span>
                </div>
              )}
            </div>

            {/* SHEET CONTENT WRAPPER */}
            <div className="overflow-y-auto max-h-[72vh] p-4 pt-1 custom-scrollbar">

              {/* SHEET 1: INLINE TEXT EDITOR */}
              {activeSheetType === 'text_editor' && selectedSubtitle && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <Edit3 className="w-4 h-4 text-amber-400" />
                      <span>Sửa Nội Dung Phụ Đề</span>
                    </span>
                    <button
                      onClick={() => setShowTextEditor(false)}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-slate-400">Văn bản gốc (OCR):</label>
                    <textarea
                      value={editTextOriginal}
                      onChange={(e) => setEditTextOriginal(e.target.value)}
                      rows={2}
                      className="w-full bg-[#101013] border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      placeholder="Nhập chữ gốc..."
                    />

                    <label className="text-[11px] font-semibold text-amber-400 mt-1">Bản dịch (Hiển thị):</label>
                    <textarea
                      value={editTextTranslated}
                      onChange={(e) => setEditTextTranslated(e.target.value)}
                      rows={2}
                      className="w-full bg-[#101013] border border-amber-500/50 rounded-lg p-2 text-xs text-amber-200 font-medium focus:outline-none focus:border-amber-400"
                      placeholder="Nhập bản dịch tiếng Việt..."
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setShowTextEditor(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveTextEditor}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1 shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      <span>Lưu Thay Đổi</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SHEET 1B: TEXT OVERLAY CONTENT EDITOR */}
              {activeSheetType === 'text_overlay_editor' && selectedTextItem && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <Edit3 className="w-4 h-4 text-sky-400" />
                      <span>Sửa Nội Dung {selectedTextItem.isTitle ? 'Tiêu Đề' : 'Văn Bản'}</span>
                    </span>
                    <button
                      onClick={() => setShowTextOverlayEditor(false)}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-slate-300">Nội dung hiển thị trên video:</label>
                    <textarea
                      value={editTextOverlayContent}
                      onChange={(e) => setEditTextOverlayContent(e.target.value)}
                      rows={3}
                      className="w-full bg-[#101013] border border-sky-500/50 rounded-lg p-2.5 text-xs text-sky-100 font-medium focus:outline-none focus:border-sky-400 shadow-inner"
                      placeholder="Nhập nội dung văn bản / tiêu đề..."
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setShowTextOverlayEditor(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => {
                        if (onChangeTextOverlays) {
                          const nextList = (textOverlays || []).map((t) =>
                            t.id === selectedTextItem.id ? { ...t, text: editTextOverlayContent } : t
                          );
                          onChangeTextOverlays(nextList);
                        }
                        setShowTextOverlayEditor(false);
                        triggerToast('Đã cập nhật nội dung văn bản');
                      }}
                      className="px-4 py-1.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow-md hover:brightness-110 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Lưu Thay Đổi</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SHEET 1C: INDEPENDENT TEXT OVERLAY STYLE CONFIG PANEL (Reuses SubtitleStylingPanel independently) */}
              {activeSheetType === 'text_overlay_config' && selectedTextItem && (
                <div className="flex flex-col gap-3 text-xs">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white uppercase tracking-wider block">
                          Kiểu Chữ {selectedTextItem.isTitle ? 'Tiêu Đề' : 'Văn Bản'} (Độc Lập Phụ Đề)
                        </span>
                        <span className="text-[10.5px] text-zinc-400 block">
                          Giao diện chuẩn như phụ đề, hoạt động riêng biệt độc lập không đồng bộ với phụ đề
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowTextOverlayConfig(false)}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <SubtitleStylingPanel
                    styleConfig={textOverlayStyleConfig}
                    onChangeStyle={handleUpdateTextOverlayStyleConfig}
                    onClose={() => setShowTextOverlayConfig(false)}
                  />
                </div>
              )}

              {/* SHEET 2: CONFIG STYLE PANEL */}
              {activeSheetType === 'config' && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <Palette className="w-4 h-4 text-amber-400" />
                      <span>Cấu Hình Kiểu Chữ & Phụ Đề</span>
                    </span>
                    <button
                      onClick={() => {
                        setShowConfigPanel(false);
                        if (activeTab === 'config' || activeTab === 'style') onSelectTab(null);
                      }}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <SubtitleStylingPanel
                    styleConfig={styleConfig}
                    onChangeStyle={onChangeStyle}
                    onClose={() => {
                      setShowConfigPanel(false);
                      if (activeTab === 'config' || activeTab === 'style') onSelectTab(null);
                    }}
                  />
                </div>
              )}

              {/* SHEET 3: TAB EXTRACT (OCR) */}
              {activeSheetType === 'extract' && (
                <div className="flex flex-col gap-3 text-xs">
                  {/* Sheet Header */}
                  <div className="flex items-center justify-between px-0.5 pb-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-white tracking-tight">Bóc tách phụ đề (OCR)</h3>
                      <button
                        type="button"
                        onClick={() => setShowOcrHelpModal(true)}
                        className="text-zinc-400 hover:text-white transition p-0.5 rounded-full"
                        title="Hướng dẫn bóc tách phụ đề"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTab(null)}
                      className="p-1 text-zinc-400 hover:text-white transition rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {isScanning ? (
                    <div className="bg-[#212124] border border-[#2d2d33] p-4 rounded-2xl space-y-3 shadow-lg">
                      <div className="flex justify-between items-center text-sky-400 font-semibold text-xs">
                        <span className="truncate pr-2">{scanProgress.message}</span>
                        <span className="font-mono font-bold shrink-0">{scanProgress.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-[#0095f6] transition-all duration-300"
                          style={{ width: `${scanProgress.percentage}%` }}
                        />
                      </div>

                      {/* Real-time Diagnostics Row */}
                      <div className="flex items-center justify-between text-[11px] bg-[#18181b] p-2.5 rounded-xl border border-zinc-800 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 font-bold">⚡ Tốc độ:</span>
                          <span className="font-mono text-zinc-200">
                            {typeof scanProgress.fps === 'number' ? scanProgress.fps.toFixed(1) : '0.0'} FPS
                          </span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-zinc-700" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-sky-400 font-bold">💻 CPU bận:</span>
                          <span className="font-mono text-zinc-200">
                            {scanProgress.cpuUsage || 0}% ({scanProgress.activeWorkers || 0}/{scanProgress.totalWorkers || 0} luồng)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={onCancelScan}
                        className="w-full py-2 bg-rose-900/40 text-rose-300 border border-rose-700/50 rounded-xl text-xs font-bold hover:bg-rose-800/60 transition"
                      >
                        Hủy quét
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Card 1: Ngôn ngữ gốc của video */}
                      <div className="bg-[#212124] border border-[#2d2d33] rounded-2xl p-3.5 transition">
                        <button
                          type="button"
                          onClick={() => setIsOcrLangExpanded(!isOcrLangExpanded)}
                          className="w-full flex items-center justify-between text-left cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs text-zinc-400 font-normal">Ngôn ngữ gốc của video</span>
                            <span className="text-sm font-semibold text-white mt-0.5">{sourceLang}</span>
                          </div>
                          {isOcrLangExpanded ? (
                            <ChevronUp className="w-5 h-5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-zinc-400" />
                          )}
                        </button>

                        {isOcrLangExpanded && (
                          <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-2">
                            {[
                              { label: 'Tiếng Trung', full: 'Tiếng Trung (Trung Quốc)' },
                              { label: 'Tiếng Anh', full: 'Tiếng Anh (English)' },
                              { label: 'Tiếng Hàn', full: 'Tiếng Hàn (Korean)' },
                              { label: 'Tiếng Nhật', full: 'Tiếng Nhật (Japanese)' },
                              { label: 'Tiếng Việt', full: 'Tiếng Việt' },
                              { label: 'Tự động phát hiện AI', full: 'Tự động phát hiện AI' },
                            ].map((item) => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => {
                                  setSourceLang(item.label);
                                  setIsOcrLangExpanded(false);
                                }}
                                className={`py-2 px-3 rounded-xl text-xs font-semibold text-left transition border cursor-pointer ${
                                  sourceLang === item.label
                                    ? 'bg-[#162738] border-sky-500 text-sky-400'
                                    : 'bg-[#18181b] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card 2: Chế độ bóc tách */}
                      <div className="bg-[#212124] border border-[#2d2d33] rounded-2xl p-3.5 transition">
                        <button
                          type="button"
                          onClick={() => setIsOcrModeExpanded(!isOcrModeExpanded)}
                          className="w-full flex items-center justify-between text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
                              <Gauge className="w-4 h-4 text-sky-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-zinc-400 font-normal">Chế độ bóc tách</span>
                              <span className="text-sm font-semibold text-white mt-0.5">
                                {ocrMode === 'fast' ? '⚡ Bóc tách nhanh (Cân bằng)' : '🎯 Bóc tách kỹ (Chính xác cao)'}
                              </span>
                            </div>
                          </div>
                          {isOcrModeExpanded ? (
                            <ChevronUp className="w-5 h-5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-zinc-400" />
                          )}
                        </button>

                        {isOcrModeExpanded && (
                          <div className="mt-3 pt-3 border-t border-zinc-800/80">
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setOcrMode('fast');
                                  setScanInterval(0.60);
                                }}
                                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                                  ocrMode === 'fast'
                                    ? 'bg-[#162738] border-sky-500 text-sky-400 shadow-sm'
                                    : 'bg-[#1a1a1d] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                <span>⚡ Bóc tách nhanh</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOcrMode('deep');
                                  setScanInterval(0.40);
                                }}
                                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                                  ocrMode === 'deep'
                                    ? 'bg-[#162738] border-sky-500 text-sky-400 shadow-sm'
                                    : 'bg-[#1a1a1d] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                <span>🎯 Bóc tách kỹ</span>
                              </button>
                            </div>

                            <p className="mt-3 text-[11px] text-zinc-400 leading-relaxed">
                              {ocrMode === 'fast'
                                ? '⚡ Bóc tách nhanh: Tốc độ cao, nhẹ máy, thích hợp cho hầu hết các video thông thường.'
                                : '🎯 Bóc tách kỹ: Bắt chuẩn từng câu thoại ngắn (400ms-600ms), phụ đề nét mỏng và giảm trễ starttime.'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card 3: Độ mạnh lọc chữ nền */}
                      <div className="bg-[#212124] border border-[#2d2d33] rounded-2xl p-3.5 transition">
                        <button
                          type="button"
                          onClick={() => setIsOcrFilterExpanded(!isOcrFilterExpanded)}
                          className="w-full flex items-center justify-between text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
                              <Filter className="w-4 h-4 text-sky-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-zinc-400 font-normal">Độ mạnh lọc chữ nền</span>
                              <span className="text-sm font-bold text-white mt-0.5">{filterStrength}</span>
                            </div>
                          </div>
                          {isOcrFilterExpanded ? (
                            <ChevronUp className="w-5 h-5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-zinc-400" />
                          )}
                        </button>

                        {isOcrFilterExpanded && (
                          <div className="mt-3 pt-3 border-t border-zinc-800/80 px-1">
                            <div className="relative flex items-center my-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={parseInt(filterStrength.replace('%', ''), 10) || 40}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setFilterStrength(`${val}%`);
                                  if (onSaveSettings) {
                                    onSaveSettings({
                                      ...appSettings,
                                      bgFilterStrength: val,
                                    });
                                  }
                                }}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#0095f6]"
                                style={{
                                  background: `linear-gradient(to right, #0095f6 0%, #0095f6 ${parseInt(filterStrength.replace('%', ''), 10) || 40}%, #3f3f46 ${parseInt(filterStrength.replace('%', ''), 10) || 40}%, #3f3f46 100%)`,
                                }}
                              />
                            </div>
                            <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed">
                              Kéo tăng khi video có nhiều logo, chữ nhiễu từ nền video (0% đến 100%).
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card 4: Quét thích ứng thông minh (Adaptive) */}
                      <div
                        onClick={() => handleToggleAdaptiveSampling(!isAdaptiveSamplingActive)}
                        className="flex items-start gap-3 px-1 py-1 cursor-pointer select-none group"
                      >
                        <div
                          className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                            isAdaptiveSamplingActive ? 'bg-[#0095f6] text-white' : 'border border-zinc-600 bg-[#212124]'
                          }`}
                        >
                          {isAdaptiveSamplingActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                            Quét thích ứng thông minh (Adaptive)
                          </span>
                          <span className="text-xs text-zinc-400 mt-0.5">
                            Tự động tăng mật độ quét ở đoạn thoại nhanh & dãn cách ở khoảng lặng
                          </span>
                        </div>
                      </div>

                      {/* Card 5: Checkbox Lọc trùng & nhiễu bằng AI */}
                      <div
                        onClick={() => handleToggleAiRefine(!isAiRefineActive)}
                        className="flex items-start gap-3 px-1 py-1 cursor-pointer select-none group"
                      >
                        <div
                          className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                            isAiRefineActive ? 'bg-[#0095f6] text-white' : 'border border-zinc-600 bg-[#212124]'
                          }`}
                        >
                          {isAiRefineActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                            Lọc trùng & nhiễu bằng AI
                          </span>
                          <span className="text-xs text-zinc-400 mt-0.5">
                            Tự động gộp câu trùng và loại bỏ rác OCR
                          </span>
                        </div>
                      </div>

                      {/* BẮT ĐẦU BÓC TÁCH Button */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => onStartFullScan(0, Math.ceil(videoDuration) || 60, scanInterval, contextPrompt)}
                          className="w-full py-3.5 bg-[#0095f6] hover:bg-[#0087e0] active:scale-[0.99] text-white font-bold text-sm tracking-wide uppercase rounded-xl shadow-lg transition-all flex items-center justify-center cursor-pointer"
                        >
                          BẮT ĐẦU BÓC TÁCH
                        </button>

                        <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 mt-2">
                          <span>⚠️</span>
                          <span>Chỉ bấm bắt đầu ở khung hình có phụ đề chính</span>
                        </div>
                      </div>

                      {/* Subtle quick presets (9:16 / 16:9 ROI) */}
                      <div className="flex items-center justify-center gap-3 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                        <span className="text-zinc-500">Vùng quét mẫu:</span>
                        <button
                          type="button"
                          onClick={() => onChangeRoi({ x: 5, y: 70, width: 90, height: 22 })}
                          className="hover:text-sky-400 transition cursor-pointer font-medium"
                        >
                          9:16 Dọc
                        </button>
                        <span className="text-zinc-700">•</span>
                        <button
                          type="button"
                          onClick={() => onChangeRoi({ x: 10, y: 76, width: 80, height: 20 })}
                          className="hover:text-sky-400 transition cursor-pointer font-medium"
                        >
                          16:9 Ngang
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SHEET: TAB STT (Nhận diện giọng nói CapCut AI) */}
              {activeSheetType === 'stt' && (
                <div className="flex flex-col gap-3 text-xs">
                  {/* Sheet Header */}
                  <div className="flex items-center justify-between px-0.5 pb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight leading-tight">Nhận diện giọng nói (STT)</h3>
                        <p className="text-[11px] text-zinc-400">Tự động nghe âm thanh và trích xuất phụ đề bằng AI CapCut</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTab(null)}
                      className="p-1 text-zinc-400 hover:text-white transition rounded-full cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {isSttRunning ? (
                    <div className="bg-[#212124] border border-[#2d2d33] p-4 rounded-2xl space-y-3 shadow-lg">
                      <div className="flex justify-between items-center text-sky-400 font-semibold text-xs">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                          <span className="truncate pr-2">{sttProgress?.message || 'Đang xử lý nhận diện giọng nói...'}</span>
                        </div>
                        <span className="font-mono font-bold shrink-0">{sttProgress?.percentage || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${Math.max(5, sttProgress?.percentage || 0)}%` }}
                        />
                      </div>

                      <div className="text-[11px] bg-[#18181b] p-2.5 rounded-xl border border-zinc-800 font-medium text-zinc-300 flex items-center justify-between">
                        <span>🤖 Engine: ByteDance CapCut VOD ASR</span>
                        <span className="text-emerald-400 font-mono">Đang nhận diện</span>
                      </div>

                      {onCancelStt && (
                        <button
                          type="button"
                          onClick={onCancelStt}
                          className="w-full py-2 bg-rose-900/40 text-rose-300 border border-rose-700/50 rounded-xl text-xs font-bold hover:bg-rose-800/60 transition cursor-pointer"
                        >
                          Hủy nhận diện
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Card 1: Ngôn ngữ giọng nói trong video */}
                      <div className="bg-[#212124] border border-[#2d2d33] rounded-2xl p-3.5 transition">
                        <button
                          type="button"
                          onClick={() => setIsSttLangExpanded(!isSttLangExpanded)}
                          className="w-full flex items-center justify-between text-left cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs text-zinc-400 font-normal">Ngôn ngữ giọng nói trong video</span>
                            <span className="text-sm font-semibold text-white mt-0.5">
                              {
                                [
                                  { code: 'zh-CN', label: 'Tiếng Trung (Trung Quốc / Douyin / Phim)' },
                                  { code: 'vi-VN', label: 'Tiếng Việt' },
                                  { code: 'en-US', label: 'Tiếng Anh (English)' },
                                  { code: 'ja-JP', label: 'Tiếng Nhật (Japanese)' },
                                  { code: 'ko-KR', label: 'Tiếng Hàn (Korean)' },
                                  { code: 'th-TH', label: 'Tiếng Thái (Thai)' },
                                  { code: 'id-ID', label: 'Tiếng Indonesia' },
                                  { code: 'auto', label: 'Tự động phát hiện AI' },
                                ].find(l => l.code === sttLanguage)?.label || sttLanguage
                              }
                            </span>
                          </div>
                          {isSttLangExpanded ? (
                            <ChevronUp className="w-5 h-5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-zinc-400" />
                          )}
                        </button>

                        {isSttLangExpanded && (
                          <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-2">
                            {[
                              { code: 'zh-CN', label: 'Tiếng Trung' },
                              { code: 'vi-VN', label: 'Tiếng Việt' },
                              { code: 'en-US', label: 'Tiếng Anh' },
                              { code: 'ja-JP', label: 'Tiếng Nhật' },
                              { code: 'ko-KR', label: 'Tiếng Hàn' },
                              { code: 'th-TH', label: 'Tiếng Thái' },
                              { code: 'id-ID', label: 'Tiếng Indonesia' },
                              { code: 'auto', label: 'Tự động phát hiện' },
                            ].map((item) => (
                              <button
                                key={item.code}
                                type="button"
                                onClick={() => {
                                  setSttLanguage(item.code);
                                  setIsSttLangExpanded(false);
                                }}
                                className={`py-2 px-3 rounded-xl text-xs font-semibold text-left transition border cursor-pointer ${
                                  sttLanguage === item.code
                                    ? 'bg-[#162738] border-sky-500 text-sky-400'
                                    : 'bg-[#18181b] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card 2: Tự động dịch sang Tiếng Việt */}
                      <div className="bg-[#212124] border border-[#2d2d33] rounded-2xl p-3.5 flex items-center justify-between">
                        <div className="flex flex-col pr-3">
                          <span className="text-xs font-semibold text-white">Tự động dịch sang Tiếng Việt</span>
                          <span className="text-[11px] text-zinc-400 mt-0.5">
                            AI sẽ tự động dịch các câu thoại nhận diện được sang Tiếng Việt tự nhiên
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={sttAutoTranslate}
                          onChange={(e) => setSttAutoTranslate(e.target.checked)}
                          className="w-5 h-5 rounded border-zinc-700 text-sky-500 focus:ring-0 cursor-pointer accent-sky-500"
                        />
                      </div>

                      {/* Card 3: Đoạn video cần nhận diện */}
                      <div className="bg-[#212124] border border-[#2d2d33] rounded-2xl p-3.5 space-y-3">
                        <span className="text-xs text-zinc-400 font-normal">Phạm vi nhận diện giọng nói</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSttRange('full')}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                              sttRange === 'full'
                                ? 'bg-[#162738] border-sky-500 text-sky-400'
                                : 'bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            Toàn bộ video (0 - {Math.ceil(videoDuration || 60)}s)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSttRange('range')}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                              sttRange === 'range'
                                ? 'bg-[#162738] border-sky-500 text-sky-400'
                                : 'bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            Tùy chỉnh khoảng thời gian
                          </button>
                        </div>

                        {sttRange === 'range' && (
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1 bg-[#18181b] border border-zinc-800 rounded-xl px-2.5 py-1.5 flex flex-col">
                              <span className="text-[10px] text-zinc-500">Bắt đầu (giây)</span>
                              <input
                                type="number"
                                min={0}
                                max={videoDuration || 9999}
                                value={sttStartTime}
                                onChange={(e) => setSttStartTime(Math.max(0, Number(e.target.value) || 0))}
                                className="bg-transparent text-sm font-mono text-white focus:outline-none"
                              />
                            </div>
                            <span className="text-zinc-600 font-bold">→</span>
                            <div className="flex-1 bg-[#18181b] border border-zinc-800 rounded-xl px-2.5 py-1.5 flex flex-col">
                              <span className="text-[10px] text-zinc-500">Kết thúc (giây)</span>
                              <input
                                type="number"
                                min={0}
                                max={videoDuration || 9999}
                                value={sttEndTime}
                                onChange={(e) => setSttEndTime(Math.max(0, Number(e.target.value) || 0))}
                                className="bg-transparent text-sm font-mono text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card 4: Chế độ lưu phụ đề */}
                      <div className="bg-[#212124] border border-[#2d2d33] rounded-2xl p-3.5 space-y-2">
                        <span className="text-xs text-zinc-400 font-normal">Chế độ danh sách phụ đề</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSttMode('replace')}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                              sttMode === 'replace'
                                ? 'bg-[#162738] border-sky-500 text-sky-400'
                                : 'bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            Ghi đè phụ đề cũ
                          </button>
                          <button
                            type="button"
                            onClick={() => setSttMode('append')}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                              sttMode === 'append'
                                ? 'bg-[#162738] border-sky-500 text-sky-400'
                                : 'bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            Thêm nối tiếp
                          </button>
                        </div>
                      </div>

                      {/* STT Trigger Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onStartCapCutStt) {
                            onStartCapCutStt({
                              language: sttLanguage,
                              autoTranslateToVietnamese: sttAutoTranslate,
                              range: sttRange,
                              startTime: sttStartTime,
                              endTime: sttEndTime,
                              mode: sttMode,
                            });
                          }
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
                      >
                        <Mic className="w-5 h-5 text-white" />
                        <span className="text-sm">Bắt đầu nhận diện giọng nói (CapCut STT)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SHEET 4: TAB TRANSLATE (Dịch thuật AI) */}
              {activeSheetType === 'translate' && (
                <div className="flex flex-col gap-4 p-1">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white tracking-wide">Dịch thuật AI</h3>
                      <button
                        type="button"
                        onClick={() => setShowTranslationContext(!showTranslationContext)}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                          showTranslationContext
                            ? 'text-white bg-emerald-500 shadow-md'
                            : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                        }`}
                        title="Ngữ cảnh dịch thuật chuyên sâu"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => onSelectTab(null)}
                      className="p-1.5 text-zinc-400 hover:text-white rounded-full transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Global Movie Context & Entity Glossary Display */}
                  {globalContext ? (
                    <div className="bg-gradient-to-br from-indigo-950/40 via-[#181822] to-purple-950/30 border border-indigo-500/30 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <span className="font-bold text-indigo-200 text-xs tracking-wide">
                            Ngữ Cảnh Phim & Từ Điển Thực Thể
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {globalContext.movieGenre || 'Tự động'}
                        </span>
                      </div>

                      {globalContext.characterPronounGuide && (
                        <p className="text-[11px] text-zinc-300 bg-black/30 rounded-lg p-2 border border-zinc-800/60 leading-relaxed">
                          <strong className="text-indigo-300 font-semibold">Quy tắc xưng hô: </strong>
                          {globalContext.characterPronounGuide}
                        </p>
                      )}

                      {globalContext.knownEntityGlossary && globalContext.knownEntityGlossary.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span>Từ điển thực thể ({globalContext.knownEntityGlossary.length} mục):</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                            {globalContext.knownEntityGlossary.map((item, idx) => (
                              <div
                                key={idx}
                                className="text-[10px] px-2 py-1 rounded-md bg-indigo-950/60 border border-indigo-700/50 text-indigo-200 flex items-center space-x-1"
                                title={item.description || `${item.original} -> ${item.translated}`}
                              >
                                <span className="text-zinc-400">{item.original}</span>
                                <span className="text-indigo-400">→</span>
                                <span className="font-bold text-indigo-100">{item.translated}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#181822] border border-indigo-500/20 rounded-xl p-3 flex items-start space-x-2.5">
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-zinc-300 leading-relaxed">
                        <span className="font-bold text-indigo-300">Context Synchronization Expert: </span>
                        AI sẽ đọc lướt toàn bộ phụ đề để rút ra thể loại phim, tên nhân vật và xưng hô chuẩn, sau đó truyền ngữ cảnh liền mạch qua từng batch dịch.
                      </div>
                    </div>
                  )}

                  {/* Deep translation context panel (opens via the green gear button) */}
                  {showTranslationContext && (
                    <div className="bg-[#101013] border border-emerald-500/30 rounded-xl p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center space-x-1.5">
                        <Settings className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                        <span className="font-bold text-emerald-400 text-xs">Ngữ Cảnh Dịch Thuật Chuyên Sâu</span>
                      </div>
                      <textarea
                        value={contextPrompt}
                        onChange={(e) => setContextPrompt(e.target.value)}
                        placeholder="Ví dụ: Video về phim cổ trang Trung Quốc, xưng hô 'Huynh/Đệ/Ta/Nàng'..."
                        className="w-full bg-[#141418] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
                        rows={3}
                      />
                      <p className="text-[10px] text-slate-500">
                        * Cung cấp thông tin bối cảnh của video (thể loại, cách xưng hô, văn phong...) để bản dịch AI chuẩn xác hơn.
                      </p>
                    </div>
                  )}

                  {/* Engine dịch thuật */}
                  <div className="bg-[#212126] border border-zinc-700/60 rounded-xl p-3 flex flex-col gap-1">
                    <label className="text-[11px] text-zinc-400 font-medium">Engine dịch thuật</label>
                    <div className="relative flex items-center">
                      <select
                        value={appSettings.apiMode === 'proxy' ? (appSettings.proxyTargetModel || appSettings.customModelName || selectedModel) : selectedModel}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (appSettings.apiMode === 'proxy') {
                            onSaveSettings({
                              ...appSettings,
                              proxyTargetModel: val,
                              customModelName: val,
                            });
                            onSelectModel(val as any);
                          } else {
                            onSelectModel(val as any);
                          }
                        }}
                        className="w-full bg-transparent text-sm font-bold text-white focus:outline-none appearance-none pr-6 cursor-pointer"
                      >
                        {appSettings.apiMode === 'gemini_web' ? (
                          <>
                            <option value="GEMINI_WEB" className="bg-[#1c1c21] text-white">
                              Gemini Web (Google Account WebView Ẩn)
                            </option>
                            <option value="gemini-3.6-flash" className="bg-[#1c1c21] text-white">
                              Gemini 3.6 Flash (Web Automation)
                            </option>
                            <option value="gemini-3.1-pro-preview" className="bg-[#1c1c21] text-white">
                              Gemini 3.1 Pro (Web Automation)
                            </option>
                          </>
                        ) : appSettings.apiMode === 'proxy' ? (
                          <>
                            {appSettings.proxyModelsList && appSettings.proxyModelsList.length > 0 ? (
                              appSettings.proxyModelsList.map((m) => (
                                <option key={m} value={m} className="bg-[#1c1c21] text-white">
                                  {m} (Proxy)
                                </option>
                              ))
                            ) : (
                              <>
                                {appSettings.proxyTargetModel && (
                                  <option value={appSettings.proxyTargetModel} className="bg-[#1c1c21] text-white">
                                    {appSettings.proxyTargetModel} (Proxy)
                                  </option>
                                )}
                                {appSettings.customModelName && appSettings.customModelName !== appSettings.proxyTargetModel && (
                                  <option value={appSettings.customModelName} className="bg-[#1c1c21] text-white">
                                    {appSettings.customModelName} (Proxy Custom)
                                  </option>
                                )}
                                <option value="gemini-3.6-flash" className="bg-[#1c1c21] text-white">Gemini 3.6 Flash (Proxy Fallback)</option>
                                <option value="gemini-3.1-pro-preview" className="bg-[#1c1c21] text-white">Gemini 3.1 Pro (Proxy Fallback)</option>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <option value="GEMINI_WEB" className="bg-[#1c1c21] text-white">GEMINI_WEB</option>
                            <option value="gemini-2.5-flash" className="bg-[#1c1c21] text-white">Gemini 2.5 Flash</option>
                            <option value="gemini-2.5-pro" className="bg-[#1c1c21] text-white">Gemini 2.5 Pro</option>
                            <option value="gemini-2.0-flash" className="bg-[#1c1c21] text-white">Gemini 2.0 Flash</option>
                            <option value="gemini-1.5-flash" className="bg-[#1c1c21] text-white">Gemini 1.5 Flash</option>
                            <option value="gemini-3.6-flash" className="bg-[#1c1c21] text-white">Gemini 3.6 Flash</option>
                            <option value="gemini-3.1-pro-preview" className="bg-[#1c1c21] text-white">Gemini 3.1 Pro Preview</option>
                          </>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-0 pointer-events-none" />
                    </div>
                  </div>

                  {/* Dịch sang ngôn ngữ */}
                  <div className="bg-[#212126] border border-zinc-700/60 rounded-xl p-3 flex flex-col gap-1">
                    <label className="text-[11px] text-zinc-400 font-medium">Dịch sang ngôn ngữ</label>
                    <div className="relative flex items-center">
                      <select
                        value={targetLang}
                        onChange={(e) => {
                          const newLang = e.target.value;
                          onSelectTargetLang(newLang);
                          onSaveSettings({ ...appSettings, targetLang: newLang });
                        }}
                        className="w-full bg-transparent text-sm font-bold text-white focus:outline-none appearance-none pr-6 cursor-pointer"
                      >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.name} className="bg-[#1c1c21] text-white">
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-0 pointer-events-none" />
                    </div>
                  </div>

                  {/* Checkbox: Tối ưu hóa cho thuyết minh (TTS) */}
                  <label className="flex items-center space-x-3 cursor-pointer py-1 select-none">
                    <input
                      type="checkbox"
                      checked={optimizeForTts}
                      onChange={(e) => setOptimizeForTts(e.target.checked)}
                      className="w-5 h-5 rounded bg-[#212126] border-zinc-600 text-sky-500 focus:ring-0 accent-sky-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-white">Tối ưu hóa cho thuyết minh (TTS)</span>
                  </label>

                  {/* Action Button */}
                  <button
                    onClick={() => onReTranslateAll(selectedModel, optimizeForTts, contextPrompt)}
                    disabled={isTranslatingBatch || subtitles.length === 0}
                    className="w-full mt-2 py-3.5 btn-metallic text-slate-950 disabled:opacity-50 font-black text-sm sm:text-base rounded-xl transition shadow-lg active:scale-98 flex items-center justify-center uppercase tracking-wider cursor-pointer"
                  >
                    {isTranslatingBatch ? (translationProgressMsg || 'Đang dịch lại...') : 'DỊCH LẠI TOÀN BỘ'}
                  </button>
                </div>
              )}

              {/* SHEET 5: TAB AUDIO */}
              {activeSheetType === 'audio' && (
                <div className="flex flex-col gap-3.5 text-xs pb-1">
                  {/* Top Sheet Pill Handle */}
                  <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto -mt-1 mb-1 opacity-50" />

                  {/* Header Title Bar */}
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-extrabold text-white tracking-tight">Tạo Thuyết minh (TTS)</h3>
                      {onOpenConfigDrawer && (
                        <button
                          type="button"
                          onClick={onOpenConfigDrawer}
                          className="p-1 text-sky-400 hover:text-sky-300 rounded-lg hover:bg-zinc-800/60 transition"
                          title="Cấu hình hệ thống"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTab(null)}
                      className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. SELECT FIELD: TTS Engine */}
                  <div className="bg-[#242429] border border-zinc-700/60 rounded-2xl px-4 py-3 relative transition focus-within:border-sky-500">
                    <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                      TTS Engine
                    </label>
                    <select
                      value={selectedTtsProvider}
                      onChange={(e) => {
                        const provider = e.target.value as TTSProviderOption;
                        setSelectedTtsProvider(provider);
                        onSaveSettings({ ...appSettings, ttsProvider: provider });
                      }}
                      className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer appearance-none pr-7"
                    >
                      <option value="capcut_tts" className="bg-[#1e1e24] text-white">✨ CapCut TTS (K07VN - Chuẩn Giọng CapCut PC/Mobile)</option>
                      <option value="nghi_tts" className="bg-[#1e1e24] text-white">Piper TTS (Sherpa-ONNX)</option>
                      <option value="edge_tts" className="bg-[#1e1e24] text-white">Edge TTS (Online)</option>
                      <option value="tiktok_tts" className="bg-[#1e1e24] text-white">TikTok TTS (Thuyết Minh TikTok)</option>
                      <option value="gemini" className="bg-[#1e1e24] text-white">Gemini Audio (Google AI)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 bottom-3.5 pointer-events-none" />
                  </div>

                  {/* 2. SELECT FIELD: Ngôn ngữ */}
                  <div className="bg-[#242429] border border-zinc-700/60 rounded-2xl px-4 py-3 relative transition focus-within:border-sky-500">
                    <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                      Ngôn ngữ Dịch & Thuyết minh
                    </label>
                    <select
                      value="Tiếng Việt"
                      onChange={(e) => {
                        onSelectTargetLang('Tiếng Việt');
                        onSaveSettings({ ...appSettings, targetLang: 'Tiếng Việt' });
                      }}
                      className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer appearance-none pr-7"
                    >
                      <option value="Tiếng Việt" className="bg-[#1e1e24] text-white">
                        🇻🇳 Tiếng Việt
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 bottom-3.5 pointer-events-none" />
                  </div>

                  {/* 3. SELECT FIELD: Giọng thuyết minh */}
                  <div className="bg-[#242429] border border-zinc-700/60 rounded-2xl px-4 py-3 relative transition focus-within:border-sky-500">
                    <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                      Giọng thuyết minh
                    </label>

                    {/* CapCut TTS Voices */}
                    {selectedTtsProvider === 'capcut_tts' && (
                      <select
                        value={selectedCapcutVoice}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedCapcutVoice(val);
                          onSaveSettings({ ...appSettings, capcutVoice: val });
                        }}
                        className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer appearance-none pr-7"
                      >
                        <optgroup label="🎙️ Giọng Nam (Nam Tính, Tự Nhiên)" className="bg-[#1e1e24] text-sky-400 font-bold">
                          <option value="multi_male_felipe_uranus_bigtts" className="bg-[#1e1e24] text-white">🎙️ [Nam] Giọng Nam Trầm (Ấm áp, nam tính)</option>
                          <option value="BV075_streaming" className="bg-[#1e1e24] text-white">⚡ [Nam] Thanh Niên Tự Tin (Trẻ trung, dứt khoát)</option>
                        </optgroup>
                        <optgroup label="🌟 Giọng Nữ Đời Thường & Thịnh Hành" className="bg-[#1e1e24] text-pink-400 font-bold">
                          <option value="BV074_streaming" className="bg-[#1e1e24] text-white">🌟 [Nữ] Cô Gái Hoạt Ngôn (Top 1 TikTok)</option>
                          <option value="vi_female_huong" className="bg-[#1e1e24] text-white">👩 [Nữ] Giọng Nữ Phổ Thông (Tự nhiên, nhẹ nhàng)</option>
                          <option value="BV421_vivn_streaming" className="bg-[#1e1e24] text-white">💖 [Nữ] Nhỏ Ngọt Ngào (Dễ thương)</option>
                          <option value="multi_female_yangguangnv_uranus_bigtts" className="bg-[#1e1e24] text-white">☀️ [Nữ] Ban Mai (Trong trẻo)</option>
                          <option value="BV562_streaming" className="bg-[#1e1e24] text-white">🌸 [Nữ] Mai (Thanh thoát, dịu dàng)</option>
                          <option value="multi_female_peiqi_uranus_bigtts" className="bg-[#1e1e24] text-white">🎀 [Nữ] Giọng Gái Mới Lớn (Trẻ trung)</option>
                          <option value="multi_female_kiwi_uranus_bigtts" className="bg-[#1e1e24] text-white">✨ [Nữ] Sunny Idol (Năng động)</option>
                        </optgroup>
                        <optgroup label="🎬 Thuyết Minh & Review Phim, Tin Tức" className="bg-[#1e1e24] text-amber-400 font-bold">
                          <option value="multi_female_richgirl_uranus_bigtts" className="bg-[#1e1e24] text-white">🍿 [Nữ] Review Phim new</option>
                          <option value="multi_female_xyf04auto_uranus_bigtts" className="bg-[#1e1e24] text-white">🍿 [Nữ] Review Phim 2</option>
                          <option value="multi_female_daqi_uranus_bigtts" className="bg-[#1e1e24] text-white">🍿 [Nữ] Review Phim 3</option>
                          <option value="multi_female_stokie_uranus_bigtts" className="bg-[#1e1e24] text-white">🍿 [Nữ] Review Phim 4</option>
                          <option value="multi_female_tianmeijieshuo_uranus_bigtts" className="bg-[#1e1e24] text-white">🎬 [Nữ] Thuyết Minh Ngọt Ngào</option>
                          <option value="multi_female_xinwenjieshuo_uranus_bigtts" className="bg-[#1e1e24] text-white">📰 [Nữ] Bản Tin Thời Sự</option>
                          <option value="multi_female_quanweinv_uranus_bigtts" className="bg-[#1e1e24] text-white">📰 [Nữ] Bản Tin Phóng Viên</option>
                          <option value="multi_female_sisi_uranus_bigtts" className="bg-[#1e1e24] text-white">🎙️ [Nữ] Bản Tin Phát Thanh</option>
                        </optgroup>
                        <optgroup label="🎭 Biến Âm & Hiệu Ứng Hài Hước" className="bg-[#1e1e24] text-emerald-400 font-bold">
                          <option value="BV074_streaming_dsp" className="bg-[#1e1e24] text-white">👶 [Hiệu ứng] Giọng Bé (Dễ thương)</option>
                          <option value="BV560_streaming" className="bg-[#1e1e24] text-white">👑 [Hiệu ứng] Alex Đại Đế</option>
                          <option value="BV075_streaming_demon_dsp" className="bg-[#1e1e24] text-white">😈 [Hiệu ứng] Kenny Đại Đế</option>
                          <option value="BV075_streaming_robot_dsp" className="bg-[#1e1e24] text-white">🤖 [Hiệu ứng] Robot VN</option>
                          <option value="BV075_streaming_vibrato_dsp" className="bg-[#1e1e24] text-white">🎵 [Hiệu ứng] Việt Méo</option>
                        </optgroup>
                      </select>
                    )}

                    {/* Nghi TTS / Piper Voices */}
                    {selectedTtsProvider === 'nghi_tts' && (
                      <select
                        value={appSettings.nghiVoice || 'ngochuyennew'}
                        onChange={(e) => {
                          const v = e.target.value;
                          onSaveSettings({ ...appSettings, nghiVoice: v });
                          checkNghiStatus(v, true);
                        }}
                        className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer appearance-none pr-7"
                      >
                        <optgroup label="🌟 Giọng Nữ (Thuyết Minh / Kể Chuyện)" className="bg-[#1e1e24] text-sky-400 font-bold">
                          {[
                            { id: 'ngochuyennew', name: 'Ngọc Huyền (Mới - Review Phim)' },
                            { id: 'ngochuyen', name: 'Ngọc Huyền (Bản gốc)' },
                            { id: 'maiphuong', name: 'Mai Phương (Nhẹ nhàng)' },
                            { id: 'banmai', name: 'Ban Mai (Trong trẻo)' },
                            { id: 'minhthu', name: 'Minh Thu (Truyền cảm)' },
                            { id: 'mytam2', name: 'Mỹ Tâm 2 (Ấm áp)' },
                            { id: 'mytam2794', name: 'Mỹ Tâm (v2794)' },
                            { id: 'phuongtrang', name: 'Phương Trang (Dịu dàng)' },
                            { id: 'thanhphuong2', name: 'Thanh Phương (Viettel)' },
                            { id: 'calmwoman3688', name: 'Calm Woman (Điềm tĩnh)' },
                            { id: 'yannew', name: 'Yan New (Trẻ trung)' },
                          ].map((v) => {
                            const isDownloaded = nghiStatus?.downloadedVoices?.includes(v.id);
                            return (
                              <option key={v.id} value={v.id} className="bg-[#1e1e24] text-white">
                                {isDownloaded ? `✓ ${v.name} (Đã sẵn sàng)` : `⏳ ${v.name} (Chưa tải - Chọn để tải)`}
                              </option>
                            );
                          })}
                        </optgroup>
                        <optgroup label="🎙️ Giọng Nam (Truyền Cảm / Trầm Ấm)" className="bg-[#1e1e24] text-sky-400 font-bold">
                          {[
                            { id: 'lacphi', name: 'Lạc Phi (Nam chuẩn)' },
                            { id: 'duyoryx', name: 'Duy Oryx (Nam trầm ấm)' },
                            { id: 'ngocngan', name: 'Nguyễn Ngọc Ngạn (Kể chuyện / Thuyết minh)' },
                            { id: 'vietthao3886', name: 'Việt Thảo (Kể chuyện / Review)' },
                            { id: 'tranthanh3870', name: 'Trấn Thành (Hài hước / Sôi nổi)' },
                            { id: 'minhquang', name: 'Minh Quang (Nam thời sự)' },
                            { id: 'minhkhang', name: 'Minh Khang (Nam truyền cảm)' },
                            { id: 'manhdung', name: 'Mạnh Dũng (Nam mạnh mẽ)' },
                            { id: 'chieuthanh', name: 'Chiếu Thành (Nam đĩnh đạc)' },
                            { id: 'thientam', name: 'Thiện Tâm (Nam nhẹ nhàng)' },
                            { id: 'taian2', name: 'Tài An 2 (CD Media)' },
                            { id: 'taian4', name: 'Tài An 4 (CD Media)' },
                            { id: 'deepman3909', name: 'Deep Man (Nam trầm sâu)' },
                            { id: 'adam1', name: 'Adam 1 (Nam phát thanh)' },
                          ].map((v) => {
                            const isDownloaded = nghiStatus?.downloadedVoices?.includes(v.id);
                            return (
                              <option key={v.id} value={v.id} className="bg-[#1e1e24] text-white">
                                {isDownloaded ? `✓ ${v.name} (Đã sẵn sàng)` : `⏳ ${v.name} (Chưa tải - Chọn để tải)`}
                              </option>
                            );
                          })}
                        </optgroup>
                      </select>
                    )}

                    {/* Edge TTS Voices */}
                    {selectedTtsProvider === 'edge_tts' && (
                      <select
                        value={appSettings.edgeVoice || 'vi-VN-HoaiMyNeural'}
                        onChange={(e) => onSaveSettings({ ...appSettings, edgeVoice: e.target.value })}
                        className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer appearance-none pr-7"
                      >
                        <option value="vi-VN-HoaiMyNeural" className="bg-[#1e1e24] text-white">✓ Hoài Mỹ (Nữ)</option>
                        <option value="vi-VN-NamMinhNeural" className="bg-[#1e1e24] text-white">✓ Nam Minh (Nam)</option>
                      </select>
                    )}

                    {/* TikTok TTS Voices */}
                    {selectedTtsProvider === 'tiktok_tts' && (
                      <select
                        value={appSettings.tiktokVoice || 'BV074_streaming'}
                        onChange={(e) => onSaveSettings({ ...appSettings, tiktokVoice: e.target.value })}
                        className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer appearance-none pr-7"
                      >
                        <option value="BV074_streaming" className="bg-[#1e1e24] text-white">✓ Giọng Nữ mặc định hệ thống (BV074_streaming)</option>
                        <option value="BV075_streaming" className="bg-[#1e1e24] text-white">✓ Giọng Nam mặc định hệ thống (BV075_streaming)</option>
                      </select>
                    )}

                    {/* Gemini Voices */}
                    {selectedTtsProvider === 'gemini' && (
                      <select
                        value={appSettings.geminiVoice || 'Kore'}
                        onChange={(e) => onSaveSettings({ ...appSettings, geminiVoice: e.target.value })}
                        className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer appearance-none pr-7"
                      >
                        <option value="Kore" className="bg-[#1e1e24] text-white">✓ Kore (Nữ Truyền Cảm)</option>
                        <option value="Puck" className="bg-[#1e1e24] text-white">✓ Puck (Nam Trầm Ấm)</option>
                        <option value="Charon" className="bg-[#1e1e24] text-white">✓ Charon (Nam Phim)</option>
                        <option value="Aoede" className="bg-[#1e1e24] text-white">✓ Aoede (Nữ Truyện Đọc)</option>
                      </select>
                    )}

                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 bottom-3.5 pointer-events-none" />

                    {/* Active Voice Status Indicator Badge & Download Loading */}
                    {selectedTtsProvider === 'capcut_tts' && (
                      <div className="mt-2.5 flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                        <Check className="w-3.5 h-3.5 text-emerald-400 font-bold shrink-0" />
                        <span>CapCut API (K07VN) sẵn sàng — Giọng chuẩn CapCut PC/Mobile, không cần cookie</span>
                      </div>
                    )}

                    {selectedTtsProvider === 'nghi_tts' && (
                      <div className="mt-2.5">
                        {isDownloadingNghi ? (
                          <div className="flex items-center space-x-2.5 bg-sky-950/80 border border-sky-500/50 p-2.5 rounded-xl text-sky-200 text-xs font-semibold animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                            <span>{downloadMsg || `Đang tải về mô hình giọng đọc... Vui lòng đợi trong giây lát.`}</span>
                          </div>
                        ) : nghiStatus?.downloadedVoices?.includes(appSettings.nghiVoice || 'ngochuyennew') ? (
                          <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                            <Check className="w-3.5 h-3.5 text-emerald-400 font-bold shrink-0" />
                            <span>Đã sẵn sàng (Giọng đọc đã tải thành công)</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDownloadNghiModel(appSettings.nghiVoice || 'ngochuyennew')}
                            className="w-full flex items-center justify-center space-x-2 text-xs font-semibold text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 px-3 py-2 rounded-xl transition cursor-pointer"
                          >
                            <Loader2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Giọng chưa tải — Click để tải về ngay</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 4. CARD BOX: Tùy chỉnh Giọng đọc */}
                  <div className="bg-[#1c1c21] border border-zinc-800/90 rounded-2xl p-4 space-y-3.5">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                        <span className="font-bold text-xs text-white">Tùy chỉnh Giọng đọc</span>
                      </div>

                      <span className="text-[11px] font-mono font-bold text-zinc-300">
                        Speed: {ttsSpeed.toFixed(1).replace('.', ',')}x | Pitch: {(1 + ttsPitch / 10).toFixed(1).replace('.', ',')}x
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          disabled={isTestingTts}
                          onClick={async () => {
                            if (isTestingTts) return;
                            setIsTestingTts(true);
                            const sampleText = activeSubtitle
                              ? (activeSubtitle.translatedText || activeSubtitle.originalText)
                              : "Xin chào, đây là giọng đọc thử nghiệm với tốc độ và cao độ tùy chỉnh.";
                            const activeVoice = selectedTtsProvider === 'capcut_tts'
                              ? selectedCapcutVoice
                              : (selectedTtsProvider === 'edge_tts'
                                  ? (appSettings.edgeVoice || 'vi-VN-HoaiMyNeural')
                                  : (selectedTtsProvider === 'nghi_tts'
                                      ? (appSettings.nghiVoice || 'lacphi')
                                      : (appSettings.tiktokVoice || 'BV074_streaming')));
                            try {
                              await onPlayTTS(sampleText, ttsSpeed, ttsPitch, selectedTtsProvider, activeVoice);
                            } finally {
                              setTimeout(() => setIsTestingTts(false), 800);
                            }
                          }}
                          className={`text-xs font-bold flex items-center space-x-1 transition active:scale-95 px-2.5 py-1 rounded-lg border ${
                            isTestingTts
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 cursor-wait'
                              : 'text-sky-400 hover:text-sky-300 bg-sky-500/10 border-sky-500/20 cursor-pointer'
                          }`}
                          title="Nghe thử giọng đọc được chọn"
                        >
                          {isTestingTts ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                              <span>Đang tải...</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                              <span>Nghe thử</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await fetch('/api/tts/clear-cache', { method: 'POST' });
                              setIsCacheCleared(true);
                              setTimeout(() => setIsCacheCleared(false), 2500);
                            } catch {}
                          }}
                          title="Xóa sạch cache audio TTS đã lưu trên hệ thống"
                          className="text-[11px] font-medium text-zinc-400 hover:text-amber-300 flex items-center space-x-1 transition active:scale-95 bg-zinc-800/80 hover:bg-amber-500/10 px-2 py-1 rounded-lg border border-zinc-700/60 hover:border-amber-500/30"
                        >
                          <RefreshCw className={`w-3 h-3 ${isCacheCleared ? 'text-emerald-400 animate-spin' : 'text-zinc-400'}`} />
                          <span>{isCacheCleared ? 'Đã xóa cache' : 'Xóa cache'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsTuningCollapsed(!isTuningCollapsed)}
                          className="text-zinc-400 hover:text-white p-0.5"
                        >
                          {isTuningCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {!isTuningCollapsed && (
                      <div className="space-y-3.5 pt-1 border-t border-zinc-800/80">
                        {/* Speed Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-300 font-medium">Tốc độ giọng đọc</span>
                            <span className="font-mono text-white font-bold">{ttsSpeed.toFixed(1).replace('.', ',')}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={ttsSpeed}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setTtsSpeed(val);
                              onSaveSettings({ ...appSettings, ttsSpeed: val });
                            }}
                            className="w-full accent-sky-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Pitch Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-300 font-medium">Cao độ giọng đọc (Pitch)</span>
                            <span className="font-mono text-white font-bold">{(1 + ttsPitch / 10).toFixed(1).replace('.', ',')}x</span>
                          </div>
                          <input
                            type="range"
                            min="-5"
                            max="5"
                            step="1"
                            value={ttsPitch}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setTtsPitch(val);
                              onSaveSettings({ ...appSettings, ttsPitch: val });
                            }}
                            className="w-full accent-sky-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                          Chỉnh giọng trầm hơn (0.5x) hoặc thanh bổng hơn (1.5x). Mặc định 1.0x.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 5. CHECKBOXES: Audio Sync & Gộp phụ đề */}
                  <div className="space-y-2.5 px-1 pt-1 border-t border-zinc-800/80">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="audio-sync-chk"
                        checked={appSettings.enableAudioSync !== false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          onSaveSettings({ ...appSettings, enableAudioSync: checked });
                        }}
                        className="accent-sky-500 w-4 h-4 rounded cursor-pointer mt-0.5"
                      />
                      <label htmlFor="audio-sync-chk" className="cursor-pointer select-none space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-white block">Audio Sync (Khớp thời lượng)</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            appSettings.enableAudioSync !== false
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {appSettings.enableAudioSync !== false ? 'BẬT' : 'TẮT'}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 block leading-tight">
                          Tự động dãn/nén tốc độ giọng đọc (atempo) để khớp hoàn toàn với độ dài khung từng block phụ đề.
                        </span>
                      </label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="merge-subtitles-chk"
                        checked={autoMergeSubtitles}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAutoMergeSubtitles(checked);
                          if (checked) {
                            onMergeShortSubtitles();
                          }
                        }}
                        className="accent-sky-500 w-4 h-4 rounded cursor-pointer mt-0.5"
                      />
                      <label htmlFor="merge-subtitles-chk" className="cursor-pointer select-none space-y-0.5">
                        <span className="font-bold text-xs text-white block">Gộp phụ đề</span>
                        <span className="text-[11px] text-zinc-400 block">Gộp các đoạn ngắn đứt gãy để audio liền mạch hơn</span>
                      </label>
                    </div>
                  </div>

                  {/* 6. MAIN ACTION BUTTON: TẠO AUDIO */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (autoMergeSubtitles) {
                          onMergeShortSubtitles();
                        }
                        onGenerateAllAudio();
                      }}
                      disabled={isGeneratingAllAudio || subtitles.length === 0}
                      className="w-full py-3.5 bg-[#0088ff] hover:bg-[#0077ee] disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-500/20 transition active:scale-[0.98] uppercase tracking-wider flex items-center justify-center space-x-2"
                    >
                      {isGeneratingAllAudio ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>ĐANG TẠO AUDIO ({audioGenProgress.current}/{audioGenProgress.total})...</span>
                        </>
                      ) : (
                        <span>TẠO AUDIO</span>
                      )}
                    </button>

                    {/* Secondary Playback Options */}
                    <div className="flex items-center justify-between px-1 text-[11px]">
                      <label className="flex items-center space-x-2 cursor-pointer text-zinc-300 font-medium">
                        <input
                          type="checkbox"
                          checked={audioPlayWithVideo}
                          onChange={(e) => onToggleAudioPlayWithVideo(e.target.checked)}
                          className="accent-sky-500 w-3.5 h-3.5 rounded"
                        />
                        <span>Tự phát thuyết minh khi chạy video</span>
                      </label>

                      <button
                        type="button"
                        onClick={onClearAllAudio}
                        className="text-rose-400 hover:text-rose-300 font-medium underline flex items-center space-x-1"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Xóa Audio</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SHEET 6: TAB FILTERS (Lọc từ khóa / Watermark rác) */}
              {activeSheetType === 'filters' && (
                <div className="flex flex-col gap-3 text-xs max-w-sm mx-auto w-full">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <h3 className="text-sm font-bold text-white">Lọc từ khóa / Watermark</h3>
                    <button
                      type="button"
                      onClick={() => onSelectTab(null)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={filterKeywords}
                        onChange={(e) => setFilterKeywords(e.target.value)}
                        placeholder="Nhập từ khóa cần lọc"
                        className="w-full bg-[#16161a] border border-[#26262b] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-medium"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleExecuteFilterSmart}
                      className="w-full py-2.5 bg-gradient-to-r from-slate-200 via-zinc-100 to-slate-300 hover:from-white hover:via-slate-100 hover:to-zinc-200 text-zinc-900 border border-slate-300/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_2px_4px_rgba(0,0,0,0.2)] font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-200 transform active:scale-95 cursor-pointer text-center select-none"
                    >
                      THỰC HIỆN LỌC
                    </button>

                    <div className="pt-2 border-t border-zinc-800/80">
                      <button
                        type="button"
                        onClick={handleCleanAllSubtitleArtifacts}
                        className="w-full py-2 px-3 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 text-emerald-300 hover:text-emerald-100 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition active:scale-95"
                        title="Tự động loại bỏ mọi rác AI, ghi chú lỗi chính tả, thẻ đếm ký tự (拼写错误, chars - Limit, Correction...)"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>DỌN DẸP RÁC & LỖI AI TRÊN TẤT CẢ PHỤ ĐỀ</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SHEET 7: TAB FIND & REPLACE (Tìm kiếm & Thay thế) */}
              {activeSheetType === 'find_replace' && (
                <div className="flex flex-col gap-3 text-xs max-w-sm mx-auto w-full">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <h3 className="text-sm font-bold text-white">Tìm & Thay thế</h3>
                    <button
                      type="button"
                      onClick={() => onSelectTab(null)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                        placeholder="Tìm từ"
                        className="w-full bg-[#16161a] border border-[#26262b] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-medium"
                      />
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                        placeholder="Thay thế bằng"
                        className="w-full bg-[#16161a] border border-[#26262b] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-medium"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleFindReplace}
                      className="w-full py-2.5 bg-gradient-to-r from-slate-200 via-zinc-100 to-slate-300 hover:from-white hover:via-slate-100 hover:to-zinc-200 text-zinc-900 border border-slate-300/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_2px_4px_rgba(0,0,0,0.2)] font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-200 transform active:scale-95 cursor-pointer text-center select-none"
                    >
                      THỰC HIỆN THAY THẾ
                    </button>

                    <div className="pt-2 border-t border-zinc-800/80">
                      <button
                        type="button"
                        onClick={handleCleanAllSubtitleArtifacts}
                        className="w-full py-2 px-3 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 text-emerald-300 hover:text-emerald-100 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition active:scale-95"
                        title="Tự động loại bỏ mọi rác AI, ghi chú lỗi chính tả, thẻ đếm ký tự (拼写错误, chars - Limit, Correction...)"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>DỌN DẸP RÁC & THẺ DEBUG AI</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SHEET 8: TAB OVERLAYS (Chèn logo, Chèn chữ) */}
              {activeSheetType === 'overlays' && filtersSubTab !== 'blur' && (
                <div className="flex flex-col gap-3 text-xs max-w-sm mx-auto w-full">
                  {/* Top Bar with dynamic title based on filtersSubTab */}
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <h3 className="text-sm font-bold text-white">
                      {filtersSubTab === 'logo' && "Chèn Logo Thương Hiệu"}
                      {filtersSubTab === 'text_overlay' && "Chèn Văn Bản / Chữ"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => onSelectTab(null)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* SUB TAB 2: LOGO OVERLAYS */}
                  {filtersSubTab === 'logo' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          Chèn logo thương hiệu của bạn lên video. Bạn có thể kéo thả di chuyển trực tiếp trên khung video, tùy chỉnh kích thước, độ bo góc và độ mờ.
                        </p>
                        <label className="w-full py-2.5 bg-gradient-to-r from-slate-200 via-zinc-100 to-slate-300 hover:from-white hover:via-slate-100 hover:to-zinc-200 text-zinc-900 border border-slate-300/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_2px_4px_rgba(0,0,0,0.2)] font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-200 transform active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5 select-none">
                          <Camera className="w-4 h-4 text-zinc-900" />
                          <span>CHỌN ẢNH LOGO</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleAddLogoOverlay(file);
                            }}
                          />
                        </label>
                      </div>

                      {logoOverlays.length === 0 ? (
                        <div className="text-center py-5 text-slate-500 text-xs bg-[#141418] rounded-xl border border-zinc-800/80">
                          Chưa có logo nào được chèn
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {logoOverlays.map((logo, index) => (
                            <div key={logo.id} className="bg-[#141418] border border-[#26262b] p-3 rounded-xl space-y-3">
                              {/* Header item */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <img
                                    src={logo.url}
                                    className="w-9 h-9 object-contain bg-slate-900 border border-slate-700 transition-all"
                                    style={{ borderRadius: `${Math.min(18, (logo.borderRadius || 0) / 2)}px` }}
                                    alt="logo"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <span className="text-xs font-bold text-slate-200">Logo #{index + 1}</span>
                                    <p className="text-[10px] text-slate-400">Kích thước: {Math.round(logo.width)}% × {Math.round(logo.height)}%</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onChangeLogoOverlays?.(logoOverlays.filter(l => l.id !== logo.id))}
                                  className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition"
                                  title="Xóa logo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Controls Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 border-t border-zinc-800/80 text-[11px]">
                                {/* Kích thước Width & Height */}
                                <div className="space-y-1 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/50">
                                  <div className="flex justify-between text-slate-300 font-semibold text-[10px]">
                                    <span>Chiều rộng</span>
                                    <span className="text-sky-400 font-mono">{Math.round(logo.width)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="3"
                                    max="80"
                                    value={logo.width}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      onChangeLogoOverlays?.(
                                        logoOverlays.map(l => l.id === logo.id ? { ...l, width: val } : l)
                                      );
                                    }}
                                    className="w-full accent-[#2196F3] h-1"
                                  />

                                  <div className="flex justify-between text-slate-300 font-semibold text-[10px] pt-1">
                                    <span>Chiều cao</span>
                                    <span className="text-sky-400 font-mono">{Math.round(logo.height)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="3"
                                    max="80"
                                    value={logo.height}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      onChangeLogoOverlays?.(
                                        logoOverlays.map(l => l.id === logo.id ? { ...l, height: val } : l)
                                      );
                                    }}
                                    className="w-full accent-[#2196F3] h-1"
                                  />
                                </div>

                                {/* Độ bo góc */}
                                <div className="space-y-1 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/50 flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between text-slate-300 font-semibold text-[10px]">
                                      <span>Độ bo góc</span>
                                      <span className="text-sky-400 font-mono">{logo.borderRadius || 0}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="60"
                                      value={logo.borderRadius || 0}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        onChangeLogoOverlays?.(
                                          logoOverlays.map(l => l.id === logo.id ? { ...l, borderRadius: val } : l)
                                        );
                                      }}
                                      className="w-full accent-[#2196F3] h-1 mt-2"
                                    />
                                  </div>
                                  <div className="flex gap-1 pt-1">
                                    {[0, 8, 16, 30].map(r => (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={() => {
                                          onChangeLogoOverlays?.(
                                            logoOverlays.map(l => l.id === logo.id ? { ...l, borderRadius: r } : l)
                                          );
                                        }}
                                        className={`flex-1 py-0.5 rounded text-[9px] font-bold border transition ${
                                          (logo.borderRadius || 0) === r
                                            ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                                            : 'bg-zinc-800 border-zinc-700 text-slate-400 hover:text-slate-200'
                                        }`}
                                      >
                                        {r === 0 ? 'Vuông' : `${r}px`}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Độ mờ Opacity */}
                                <div className="space-y-1 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/50 flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between text-slate-300 font-semibold text-[10px]">
                                      <span>Độ mờ (Opacity)</span>
                                      <span className="text-sky-400 font-mono">{logo.opacity ?? 100}%</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="10"
                                      max="100"
                                      value={logo.opacity ?? 100}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        onChangeLogoOverlays?.(
                                          logoOverlays.map(l => l.id === logo.id ? { ...l, opacity: val } : l)
                                        );
                                      }}
                                      className="w-full accent-[#2196F3] h-1 mt-2"
                                    />
                                  </div>
                                  <div className="flex gap-1 pt-1">
                                    {[100, 80, 50, 30].map(op => (
                                      <button
                                        key={op}
                                        type="button"
                                        onClick={() => {
                                          onChangeLogoOverlays?.(
                                            logoOverlays.map(l => l.id === logo.id ? { ...l, opacity: op } : l)
                                          );
                                        }}
                                        className={`flex-1 py-0.5 rounded text-[9px] font-bold border transition ${
                                          (logo.opacity ?? 100) === op
                                            ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                                            : 'bg-zinc-800 border-zinc-700 text-slate-400 hover:text-slate-200'
                                        }`}
                                      >
                                        {op}%
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Vị trí nhanh */}
                              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                                <span className="font-semibold">Vị trí nhanh:</span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onChangeLogoOverlays?.(
                                        logoOverlays.map(l => l.id === logo.id ? { ...l, x: 5, y: 5 } : l)
                                      );
                                    }}
                                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-slate-300 hover:text-white"
                                  >
                                    Góc trên-trái
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onChangeLogoOverlays?.(
                                        logoOverlays.map(l => l.id === logo.id ? { ...l, x: 100 - logo.width - 5, y: 5 } : l)
                                      );
                                    }}
                                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-slate-300 hover:text-white"
                                  >
                                    Góc trên-phải
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onChangeLogoOverlays?.(
                                        logoOverlays.map(l => l.id === logo.id ? { ...l, x: (100 - logo.width) / 2, y: (100 - logo.height) / 2 } : l)
                                      );
                                    }}
                                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-slate-300 hover:text-white"
                                  >
                                    Ở giữa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onChangeLogoOverlays?.(
                                        logoOverlays.map(l => l.id === logo.id ? { ...l, x: 5, y: 100 - logo.height - 5 } : l)
                                      );
                                    }}
                                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-slate-300 hover:text-white"
                                  >
                                    Góc dưới-trái
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onChangeLogoOverlays?.(
                                        logoOverlays.map(l => l.id === logo.id ? { ...l, x: 100 - logo.width - 5, y: 100 - logo.height - 5 } : l)
                                      );
                                    }}
                                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-slate-300 hover:text-white"
                                  >
                                    Góc dưới-phải
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB TAB 3: TEXT OVERLAYS */}
                  {filtersSubTab === 'text_overlay' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          Chèn chữ tiêu đề hoặc watermark thương hiệu. Config font, màu sắc, viền, bóng, nền được điều chỉnh hoàn toàn riêng biệt với phụ đề dịch.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddTextOverlay}
                          className="w-full py-2.5 bg-gradient-to-r from-slate-200 via-zinc-100 to-slate-300 hover:from-white hover:via-slate-100 hover:to-zinc-200 text-zinc-900 border border-slate-300/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_2px_4px_rgba(0,0,0,0.2)] font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-200 transform active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5 select-none"
                        >
                          <Plus className="w-4 h-4 text-zinc-900 stroke-[3px]" />
                          <span>THÊM CHỮ CHÈN MỚI</span>
                        </button>
                      </div>

                      {textOverlays.length === 0 ? (
                        <div className="text-center py-5 text-slate-500 text-xs bg-[#141418] rounded-xl border border-zinc-800/80">
                          Chưa có đoạn chữ nào được chèn
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                          {textOverlays.map((textItem, index) => (
                            <div key={textItem.id} className="bg-[#141418] border border-[#26262b] p-3 rounded-xl space-y-3">
                              {/* Header & Text Input */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-sky-400">Đoạn chữ #{index + 1}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {Math.round(textItem.width)}% × {Math.round(textItem.height)}%
                                    </span>
                                  </div>
                                  <textarea
                                    rows={2}
                                    value={textItem.text}
                                    onChange={(e) => {
                                      onChangeTextOverlays?.(
                                        textOverlays.map(t => t.id === textItem.id ? { ...t, text: e.target.value } : t)
                                      );
                                    }}
                                    className="w-full bg-[#16161a] border border-[#2e2e36] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-zinc-500 focus:outline-none focus:border-[#2196F3] font-medium resize-none"
                                    placeholder="Nhập nội dung chữ..."
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onChangeTextOverlays?.(textOverlays.filter(t => t.id !== textItem.id))}
                                  className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition flex-shrink-0 mt-4"
                                  title="Xóa đoạn chữ này"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Typography Controls (Font, Size, Weight, Style, Align) */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 text-[11px]">
                                {/* Font family select */}
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-300 font-semibold">Phông chữ riêng</span>
                                  <select
                                    value={textItem.fontFamily || 'Be Vietnam Pro'}
                                    onChange={(e) => {
                                      onChangeTextOverlays?.(
                                        textOverlays.map(t => t.id === textItem.id ? { ...t, fontFamily: e.target.value } : t)
                                      );
                                    }}
                                    className="w-full bg-[#16161a] border border-[#2e2e36] rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-[#2196F3]"
                                  >
                                    <option value="Be Vietnam Pro">Be Vietnam Pro (Chuẩn TV)</option>
                                    <option value="Montserrat">Montserrat (Hiện đại)</option>
                                    <option value="Inter">Inter (Quốc tế)</option>
                                    <option value="Roboto">Roboto (Rõ ràng)</option>
                                    <option value="Oswald">Oswald (Tiêu đề cao)</option>
                                    <option value="Playfair Display">Playfair Display (Sang trọng)</option>
                                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                                    <option value="Arial, sans-serif">Arial (Cơ bản)</option>
                                  </select>
                                </div>

                                {/* Font Size Slider */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-slate-300 font-semibold text-[10px]">
                                    <span>Cỡ chữ</span>
                                    <span className="text-sky-400 font-mono">{textItem.fontSize || 28}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="12"
                                    max="96"
                                    value={textItem.fontSize || 28}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      onChangeTextOverlays?.(
                                        textOverlays.map(t => t.id === textItem.id ? { ...t, fontSize: val } : t)
                                      );
                                    }}
                                    className="w-full accent-[#2196F3] h-1"
                                  />
                                </div>

                                {/* Text Formatting & Align Buttons */}
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const isBold = textItem.fontWeight === 'bold' || textItem.fontWeight === '800';
                                      onChangeTextOverlays?.(
                                        textOverlays.map(t => t.id === textItem.id ? { ...t, fontWeight: isBold ? 'normal' : 'bold' } : t)
                                      );
                                    }}
                                    className={`p-1.5 rounded-md border text-xs font-bold transition flex items-center justify-center flex-1 ${
                                      textItem.fontWeight === 'bold' || textItem.fontWeight === '800'
                                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                                        : 'bg-zinc-800 border-zinc-700 text-slate-400 hover:text-slate-200'
                                    }`}
                                    title="In đậm (Bold)"
                                  >
                                    <Bold className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const isItalic = textItem.fontStyle === 'italic';
                                      onChangeTextOverlays?.(
                                        textOverlays.map(t => t.id === textItem.id ? { ...t, fontStyle: isItalic ? 'normal' : 'italic' } : t)
                                      );
                                    }}
                                    className={`p-1.5 rounded-md border text-xs font-bold transition flex items-center justify-center flex-1 ${
                                      textItem.fontStyle === 'italic'
                                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                                        : 'bg-zinc-800 border-zinc-700 text-slate-400 hover:text-slate-200'
                                    }`}
                                    title="In nghiêng (Italic)"
                                  >
                                    <Italic className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onChangeTextOverlays?.(
                                        textOverlays.map(t => t.id === textItem.id ? { ...t, textAlign: 'left' } : t)
                                      );
                                    }}
                                    className={`p-1.5 rounded-md border text-xs font-bold transition flex items-center justify-center flex-1 ${
                                      textItem.textAlign === 'left'
                                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                                        : 'bg-zinc-800 border-zinc-700 text-slate-400 hover:text-slate-200'
                                    }`}
                                    title="Căn trái"
                                  >
                                    <AlignLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onChangeTextOverlays?.(
                                        textOverlays.map(t => t.id === textItem.id ? { ...t, textAlign: 'center' } : t)
                                      );
                                    }}
                                    className={`p-1.5 rounded-md border text-xs font-bold transition flex items-center justify-center flex-1 ${
                                      (!textItem.textAlign || textItem.textAlign === 'center')
                                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                                        : 'bg-zinc-800 border-zinc-700 text-slate-400 hover:text-slate-200'
                                    }`}
                                    title="Căn giữa"
                                  >
                                    <AlignCenter className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onChangeTextOverlays?.(
                                        textOverlays.map(t => t.id === textItem.id ? { ...t, textAlign: 'right' } : t)
                                      );
                                    }}
                                    className={`p-1.5 rounded-md border text-xs font-bold transition flex items-center justify-center flex-1 ${
                                      textItem.textAlign === 'right'
                                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                                        : 'bg-zinc-800 border-zinc-700 text-slate-400 hover:text-slate-200'
                                    }`}
                                    title="Căn phải"
                                  >
                                    <AlignRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Text Color Selector */}
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] text-slate-300 font-semibold whitespace-nowrap">Màu chữ:</span>
                                  <input
                                    type="color"
                                    value={textItem.color || '#ffffff'}
                                    onChange={(e) => {
                                      onChangeTextOverlays?.(
                                        textOverlays.map(t => t.id === textItem.id ? { ...t, color: e.target.value } : t)
                                      );
                                    }}
                                    className="w-7 h-7 rounded cursor-pointer border border-[#2e2e36] bg-transparent p-0 overflow-hidden"
                                    title="Chọn màu chữ"
                                  />
                                  <div className="flex gap-1 flex-1">
                                    {['#ffffff', '#facc15', '#f43f5e', '#38bdf8', '#4ade80', '#000000'].map(c => (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                          onChangeTextOverlays?.(
                                            textOverlays.map(t => t.id === textItem.id ? { ...t, color: c } : t)
                                          );
                                        }}
                                        style={{ backgroundColor: c }}
                                        className={`w-4 h-4 rounded-full border ${textItem.color === c ? 'border-sky-400 ring-1 ring-sky-400' : 'border-zinc-700'}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Background Config (KHÔNG MẶC ĐỊNH NỀN ĐEN - CÓ SWITCH BẬT/TẮT NỀN) */}
                              <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 space-y-2 text-[11px]">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`has-bg-${textItem.id}`}
                                      checked={Boolean(textItem.hasBackground)}
                                      onChange={(e) => {
                                        onChangeTextOverlays?.(
                                          textOverlays.map(t => t.id === textItem.id ? { ...t, hasBackground: e.target.checked } : t)
                                        );
                                      }}
                                      className="rounded accent-[#2196F3] cursor-pointer"
                                    />
                                    <label htmlFor={`has-bg-${textItem.id}`} className="text-slate-200 font-semibold cursor-pointer select-none">
                                      Bật nền màu (Mặc định trong suốt, không nền đen)
                                    </label>
                                  </div>
                                  {textItem.hasBackground && (
                                    <span className="text-[10px] text-sky-400 font-mono">
                                      {textItem.backgroundColor || '#000000'} ({textItem.backgroundOpacity ?? 80}%)
                                    </span>
                                  )}
                                </div>

                                {textItem.hasBackground && (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-zinc-800/80">
                                    {/* Background Color */}
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[10px] text-slate-400">Màu nền:</span>
                                      <input
                                        type="color"
                                        value={textItem.backgroundColor || '#000000'}
                                        onChange={(e) => {
                                          onChangeTextOverlays?.(
                                            textOverlays.map(t => t.id === textItem.id ? { ...t, backgroundColor: e.target.value } : t)
                                          );
                                        }}
                                        className="w-6 h-6 rounded cursor-pointer border border-[#2e2e36] bg-transparent p-0 overflow-hidden"
                                      />
                                    </div>
                                    {/* Background Opacity */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[10px] text-slate-400">
                                        <span>Độ mờ nền:</span>
                                        <span>{textItem.backgroundOpacity ?? 80}%</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={textItem.backgroundOpacity ?? 80}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value);
                                          onChangeTextOverlays?.(
                                            textOverlays.map(t => t.id === textItem.id ? { ...t, backgroundOpacity: val } : t)
                                          );
                                        }}
                                        className="w-full accent-[#2196F3] h-1"
                                      />
                                    </div>
                                    {/* Background Border Radius */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[10px] text-slate-400">
                                        <span>Bo góc nền:</span>
                                        <span>{textItem.borderRadius || 0}px</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0"
                                        max="40"
                                        value={textItem.borderRadius || 0}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value);
                                          onChangeTextOverlays?.(
                                            textOverlays.map(t => t.id === textItem.id ? { ...t, borderRadius: val } : t)
                                          );
                                        }}
                                        className="w-full accent-[#2196F3] h-1"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Text Stroke (Viền chữ) & Shadow (Bóng chữ) */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                {/* Stroke */}
                                <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-1.5">
                                      <input
                                        type="checkbox"
                                        id={`stroke-${textItem.id}`}
                                        checked={Boolean(textItem.textOutline)}
                                        onChange={(e) => {
                                          onChangeTextOverlays?.(
                                            textOverlays.map(t => t.id === textItem.id ? { ...t, textOutline: e.target.checked } : t)
                                          );
                                        }}
                                        className="rounded accent-[#2196F3] cursor-pointer"
                                      />
                                      <label htmlFor={`stroke-${textItem.id}`} className="text-slate-300 font-semibold cursor-pointer text-[10px]">
                                        Viền chữ (Stroke)
                                      </label>
                                    </div>
                                    {textItem.textOutline && (
                                      <input
                                        type="color"
                                        value={textItem.outlineColor || '#000000'}
                                        onChange={(e) => {
                                          onChangeTextOverlays?.(
                                            textOverlays.map(t => t.id === textItem.id ? { ...t, outlineColor: e.target.value } : t)
                                          );
                                        }}
                                        className="w-5 h-5 rounded cursor-pointer border border-zinc-700 bg-transparent p-0"
                                      />
                                    )}
                                  </div>
                                  {textItem.textOutline && (
                                    <input
                                      type="range"
                                      min="1"
                                      max="8"
                                      value={textItem.outlineWidth || 2}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        onChangeTextOverlays?.(
                                          textOverlays.map(t => t.id === textItem.id ? { ...t, outlineWidth: val } : t)
                                        );
                                      }}
                                      className="w-full accent-[#2196F3] h-1"
                                    />
                                  )}
                                </div>

                                {/* Shadow */}
                                <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-1.5">
                                      <input
                                        type="checkbox"
                                        id={`shadow-${textItem.id}`}
                                        checked={Boolean(textItem.textShadow)}
                                        onChange={(e) => {
                                          onChangeTextOverlays?.(
                                            textOverlays.map(t => t.id === textItem.id ? { ...t, textShadow: e.target.checked } : t)
                                          );
                                        }}
                                        className="rounded accent-[#2196F3] cursor-pointer"
                                      />
                                      <label htmlFor={`shadow-${textItem.id}`} className="text-slate-300 font-semibold cursor-pointer text-[10px]">
                                        Đổ bóng (Shadow)
                                      </label>
                                    </div>
                                    {textItem.textShadow && (
                                      <input
                                        type="color"
                                        value={textItem.shadowColor || '#000000'}
                                        onChange={(e) => {
                                          onChangeTextOverlays?.(
                                            textOverlays.map(t => t.id === textItem.id ? { ...t, shadowColor: e.target.value } : t)
                                          );
                                        }}
                                        className="w-5 h-5 rounded cursor-pointer border border-zinc-700 bg-transparent p-0"
                                      />
                                    )}
                                  </div>
                                  {textItem.textShadow && (
                                    <input
                                      type="range"
                                      min="2"
                                      max="20"
                                      value={textItem.shadowBlur || 8}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        onChangeTextOverlays?.(
                                          textOverlays.map(t => t.id === textItem.id ? { ...t, shadowBlur: val } : t)
                                        );
                                      }}
                                      className="w-full accent-[#2196F3] h-1"
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Vị trí nhanh */}
                              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                                <span className="font-semibold">Căn nhanh:</span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onChangeTextOverlays?.(
                                        textOverlays.map(t => t.id === textItem.id ? { ...t, x: (100 - t.width) / 2, y: 5 } : t)
                                      );
                                    }}
                                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-slate-300 hover:text-white"
                                  >
                                    Đầu video
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onChangeTextOverlays?.(
                                        textOverlays.map(t => t.id === textItem.id ? { ...t, x: (100 - t.width) / 2, y: (100 - t.height) / 2 } : t)
                                      );
                                    }}
                                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-slate-300 hover:text-white"
                                  >
                                    Giữa màn hình
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onChangeTextOverlays?.(
                                        textOverlays.map(t => t.id === textItem.id ? { ...t, x: (100 - t.width) / 2, y: 100 - t.height - 5 } : t)
                                      );
                                    }}
                                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-slate-300 hover:text-white"
                                  >
                                    Cuối video
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SHEET: AUDIO VOLUME */}
              {activeSheetType === 'audio_volume' && selectedAudio && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <Volume2 className="w-4 h-4 text-[#00BDCD]" />
                      <span>Âm Lượng Audio</span>
                    </span>
                    <button
                      onClick={() => setActiveAudioSubTab(null)}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4 py-2">
                    <div className="flex justify-between items-center text-slate-300 font-bold">
                      <span>Âm lượng đoạn này</span>
                      <span className="text-[#00BDCD] font-mono text-sm">
                        {Math.round((selectedAudio.audioVolume ?? 1.0) * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <VolumeX className="w-4 h-4 text-slate-400" />
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.05"
                        value={selectedAudio.audioVolume ?? 1.0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (onUpdateAudioVolume) {
                            onUpdateAudioVolume(selectedAudio.id, val);
                          }
                        }}
                        className="flex-1 accent-[#00BDCD] h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                      <Volume2 className="w-4 h-4 text-[#00BDCD]" />
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => onUpdateAudioVolume && onUpdateAudioVolume(selectedAudio.id, 0)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                          (selectedAudio.audioVolume ?? 1.0) === 0
                            ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                            : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Tắt âm (0%)
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateAudioVolume && onUpdateAudioVolume(selectedAudio.id, 0.5)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                          (selectedAudio.audioVolume ?? 1.0) === 0.5
                            ? 'bg-[#00BDCD]/10 border-[#00BDCD] text-[#00BDCD]'
                            : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateAudioVolume && onUpdateAudioVolume(selectedAudio.id, 1.0)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                          (selectedAudio.audioVolume ?? 1.0) === 1.0
                            ? 'bg-[#00BDCD]/10 border-[#00BDCD] text-[#00BDCD]'
                            : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        100% (Chuẩn)
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateAudioVolume && onUpdateAudioVolume(selectedAudio.id, 2.0)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                          (selectedAudio.audioVolume ?? 1.0) === 2.0
                            ? 'bg-[#00BDCD]/10 border-[#00BDCD] text-[#00BDCD]'
                            : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        200% (Tối đa)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SHEET: VIDEO VOLUME */}
              {activeSheetType === 'video_volume' && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <Volume2 className="w-4 h-4 text-sky-400" />
                      <span>Âm Lượng Video Gốc</span>
                    </span>
                    <button
                      onClick={() => setActiveVideoSubTab(null)}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4 py-2">
                    <div className="flex justify-between items-center text-slate-300 font-bold">
                      <span>Âm lượng</span>
                      <span className="text-sky-400 font-mono text-sm">{Math.round(videoVolume * 100)}%</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <VolumeX className="w-4 h-4 text-slate-400" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={videoVolume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (onChangeVideoVolume) onChangeVideoVolume(val);
                        }}
                        className="flex-1 accent-sky-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                      <Volume2 className="w-4 h-4 text-sky-400" />
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => onChangeVideoVolume && onChangeVideoVolume(0)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${
                          videoVolume === 0
                            ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                            : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Tắt âm
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeVideoVolume && onChangeVideoVolume(0.5)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${
                          videoVolume === 0.5
                            ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                            : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeVideoVolume && onChangeVideoVolume(1.0)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${
                          videoVolume === 1.0
                            ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                            : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        100%
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SHEET: VIDEO SPEED */}
              {activeSheetType === 'video_speed' && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <Sliders className="w-4 h-4 text-sky-400" />
                      <span>Tốc Độ Phát Video</span>
                    </span>
                    <button
                      onClick={() => setActiveVideoSubTab(null)}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4 py-2">
                    <div className="flex justify-between items-center text-slate-300 font-bold">
                      <span>Tốc độ</span>
                      <span className="text-sky-400 font-mono text-sm">{videoSpeed}x</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-mono text-slate-500 w-6">0.2x</span>
                      <input
                        type="range"
                        min="0.2"
                        max="3.0"
                        step="0.05"
                        value={videoSpeed}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (onChangeVideoSpeed) onChangeVideoSpeed(val);
                        }}
                        className="flex-1 accent-sky-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-500 w-6 text-right">3.0x</span>
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-5 gap-1.5 pt-2">
                      {[0.5, 0.75, 1.0, 1.5, 2.0].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => onChangeVideoSpeed && onChangeVideoSpeed(preset)}
                          className={`py-1.5 rounded-lg border text-center font-mono text-xs font-bold transition ${
                            videoSpeed === preset
                              ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                              : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {preset}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {toastMessage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none z-[250]">
                <div className="bg-[#2a2a2f]/95 text-white/95 text-sm px-5 py-3 rounded-lg shadow-2xl flex items-center justify-center border border-zinc-800/80 animate-fade-in backdrop-blur-md">
                  <span className="font-medium text-zinc-300">{toastMessage}</span>
                </div>
              </div>
            )}

          </div>
        </React.Fragment>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. DYNAMIC BOTTOM TOOLBAR BAR */}
      {/* (Switches to Block Edit Mode when selectedSubtitle or isVideoSelected is active!) */}
      {/* ------------------------------------------------------------- */}
      {selectedSubtitle ? (
        /* CAPCUT SUBTITLE BLOCK EDIT TOOLBAR (< | Tạo Audio | Nghe thử | Sửa | Quét lại | Config | Xóa) */
        <div className="w-full h-full bg-[#0e0e13] px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0 animate-in fade-in duration-150">
          {/* 1. BACK BUTTON < */}
          <button
            onClick={() => {
              onSelectSubtitle(null);
              setShowTextEditor(false);
              setShowConfigPanel(false);
            }}
            className="flex-shrink-0 min-w-[56px] h-[46px] px-2 py-1 rounded-xl bg-[#181822] hover:bg-[#222230] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-300 hover:text-white mr-0.5"
            title="Bỏ chọn block phụ đề"
          >
            <ChevronLeft className="w-4.5 h-4.5 mb-0.5 text-zinc-300" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Quay lại</span>
          </button>

          {/* 2. TẠO AUDIO RIÊNG CHO PHỤ ĐỀ NÀY */}
          <button
            onClick={() => {
              if (onGenerateSingleAudio && selectedSubtitle) {
                onGenerateSingleAudio(selectedSubtitle.id);
              }
            }}
            disabled={isGeneratingSingleAudio === selectedSubtitle.id}
            className="flex-shrink-0 min-w-[66px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Tạo file âm thanh đọc riêng cho phụ đề được chọn này"
          >
            {isGeneratingSingleAudio === selectedSubtitle.id ? (
              <Loader2 className="w-4.5 h-4.5 mb-0.5 animate-spin text-[#00c5d7]" />
            ) : (
              <Mic className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            )}
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              {isGeneratingSingleAudio === selectedSubtitle.id
                ? 'Đang tạo...'
                : selectedSubtitle.audioUrl
                ? 'Tạo lại'
                : 'Tạo Audio'}
            </span>
          </button>

          {/* 3. NGHE THỬ AUDIO RIÊNG (Nếu đã có audio) */}
          {selectedSubtitle.audioUrl && onPlaySingleAudio && (
            <button
              onClick={() => onPlaySingleAudio(selectedSubtitle)}
              className="flex-shrink-0 min-w-[58px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
              title="Nghe thử âm thanh đã tạo của phụ đề này"
            >
              <Play className="w-4.5 h-4.5 mb-0.5 text-zinc-200 fill-zinc-200" />
              <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Nghe thử</span>
            </button>
          )}

          {/* 4. SỬA TEXT */}
          <button
            onClick={handleOpenTextEditor}
            className="flex-shrink-0 min-w-[54px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Sửa nội dung văn bản phụ đề"
          >
            <Edit3 className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Sửa</span>
          </button>

          {/* 5. QUÉT LẠI (OCR) */}
          {onReScanSubtitle && (
            <button
              onClick={() => {
                onReScanSubtitle(selectedSubtitle);
              }}
              className="flex-shrink-0 min-w-[58px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
              title="Quét Lại (OCR lại đoạn thời gian của phụ đề này)"
            >
              <RefreshCw className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
              <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Quét Lại</span>
            </button>
          )}

          {/* 6. CONFIG STYLING */}
          <button
            onClick={() => {
              setShowConfigPanel(true);
              setShowTextEditor(false);
            }}
            className="flex-shrink-0 min-w-[56px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Chỉnh font chữ, màu sắc, viền, kích thước"
          >
            <Palette className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Config</span>
          </button>

          {/* 7. XÓA SUBTITLE */}
          <button
            onClick={() => {
              onDeleteSubtitle(selectedSubtitle.id);
              onSelectSubtitle(null);
              setShowTextEditor(false);
              setShowConfigPanel(false);
            }}
            className="flex-shrink-0 min-w-[52px] h-[46px] px-2 py-1 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 active:scale-95 border border-rose-500/30 flex flex-col items-center justify-center transition-all cursor-pointer select-none text-rose-400 hover:text-rose-300"
            title="Xóa block phụ đề này"
          >
            <Trash2 className="w-4.5 h-4.5 mb-0.5 text-rose-400" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Xóa</span>
          </button>
        </div>
      ) : selectedAudio ? (
        /* CAPCUT AUDIO BLOCK EDIT TOOLBAR (< | Nghe thử | Âm lượng | Xóa) */
        <div className="w-full h-full bg-[#0e0e13] px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0 animate-in fade-in duration-150">
          {/* 1. BACK BUTTON <- */}
          <button
            onClick={() => {
              if (onSelectAudio) onSelectAudio(null);
              setActiveAudioSubTab(null);
            }}
            className="flex-shrink-0 min-w-[56px] h-[46px] px-2 py-1 rounded-xl bg-[#181822] hover:bg-[#222230] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-300 hover:text-white mr-0.5"
            title="Bỏ chọn block audio"
          >
            <ChevronLeft className="w-4.5 h-4.5 mb-0.5 text-zinc-300" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Quay lại</span>
          </button>

          {/* 2. NGHE THỬ */}
          <button
            onClick={() => {
              if (onPlaySingleAudio) {
                onPlaySingleAudio(selectedAudio);
              } else if (onPlayTTS) {
                onPlayTTS(selectedAudio.translatedText || selectedAudio.originalText);
              }
            }}
            className="flex-shrink-0 min-w-[62px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Nghe thử file âm thanh này"
          >
            <Play className="w-4.5 h-4.5 mb-0.5 text-zinc-200 fill-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Nghe thử</span>
          </button>

          {/* 3. ÂM LƯỢNG */}
          <button
            onClick={() => {
              setActiveAudioSubTab(activeAudioSubTab === 'volume' ? null : 'volume');
            }}
            className={`flex-shrink-0 min-w-[70px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              activeAudioSubTab === 'volume'
                ? 'border-[#00c5d7]/70 bg-[#00c5d7]/15 text-[#00c5d7] shadow-[0_0_8px_rgba(0,197,215,0.25)]'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Chỉnh âm lượng audio"
          >
            <Volume2 className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              {Math.round((selectedAudio.audioVolume ?? 1.0) * 100)}%
            </span>
          </button>

          {/* 4. XÓA */}
          <button
            onClick={() => {
              if (onDeleteSingleAudio) {
                onDeleteSingleAudio(selectedAudio.id);
              }
              if (onSelectAudio) {
                onSelectAudio(null);
              }
              setActiveAudioSubTab(null);
            }}
            className="flex-shrink-0 min-w-[52px] h-[46px] px-2 py-1 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 active:scale-95 border border-rose-500/30 flex flex-col items-center justify-center transition-all cursor-pointer select-none text-rose-400 hover:text-rose-300"
            title="Xóa âm thanh này"
          >
            <Trash2 className="w-4.5 h-4.5 mb-0.5 text-rose-400" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Xóa</span>
          </button>
        </div>
      ) : isVideoSelected ? (
        /* CONTEXT-SENSITIVE VIDEO BLOCK TOOLBAR (QUAY LẠI, THAY THẾ, ÂM LƯỢNG, TỐC ĐỘ) */
        <div className="w-full h-full bg-[#0e0e13] px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0 animate-in fade-in duration-150">
          {/* 1. BACK BUTTON <- */}
          <button
            onClick={() => {
              if (onSelectVideoBlock) onSelectVideoBlock(false);
            }}
            className="flex-shrink-0 min-w-[56px] h-[46px] px-2 py-1 rounded-xl bg-[#181822] hover:bg-[#222230] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-300 hover:text-white mr-0.5"
            title="Bỏ chọn block video"
          >
            <ChevronLeft className="w-4.5 h-4.5 mb-0.5 text-zinc-300" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Quay lại</span>
          </button>

          {/* 2. THAY THẾ (REPLACE VIDEO) */}
          <button
            onClick={() => {
              if (onOpenImportModal) onOpenImportModal();
            }}
            className="flex-shrink-0 min-w-[62px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Thay thế file video gốc"
          >
            <Camera className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Thay thế</span>
          </button>

          {/* 3. ÂM LƯỢNG (VIDEO VOLUME) */}
          <button
            onClick={() => {
              setActiveVideoSubTab(activeVideoSubTab === 'volume' ? null : 'volume');
            }}
            className={`flex-shrink-0 min-w-[64px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              activeVideoSubTab === 'volume'
                ? 'border-[#00c5d7]/70 bg-[#00c5d7]/15 text-[#00c5d7] shadow-[0_0_8px_rgba(0,197,215,0.25)]'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Chỉnh âm lượng video gốc"
          >
            <Volume2 className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              {videoVolume === 0 ? 'Tắt âm' : `${Math.round(videoVolume * 100)}%`}
            </span>
          </button>

          {/* 4. TỐC ĐỘ (VIDEO SPEED) */}
          <button
            onClick={() => {
              setActiveVideoSubTab(activeVideoSubTab === 'speed' ? null : 'speed');
            }}
            className={`flex-shrink-0 min-w-[64px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              activeVideoSubTab === 'speed'
                ? 'border-[#00c5d7]/70 bg-[#00c5d7]/15 text-[#00c5d7] shadow-[0_0_8px_rgba(0,197,215,0.25)]'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Tốc độ phát video"
          >
            <Sliders className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Tốc độ ({videoSpeed}x)
            </span>
          </button>
        </div>
      ) : selectedBlurItem ? (
        /* CONTEXT-SENSITIVE BLUR TOOLBAR: THOÁT - ĐỘ MỜ - ĐỘ BO GÓC - XÓA */
        activeBlurTool === 'blur' ? (
          <div className="w-full h-full bg-[#0e0e13] px-3 py-1.5 flex items-center justify-between gap-2.5 animate-in fade-in duration-150 flex-shrink-0">
            <button
              onClick={() => setActiveBlurTool(null)}
              className="flex-shrink-0 h-[42px] px-3 rounded-xl bg-[#181822] hover:bg-[#222230] border border-white/[0.08] flex items-center space-x-1.5 text-zinc-300 hover:text-white active:scale-95 transition cursor-pointer select-none"
              title="Quay lại"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Xong</span>
            </button>

            <div className="flex-1 flex items-center space-x-2.5 px-3 bg-[#16161d] py-1.5 rounded-xl border border-white/[0.06] min-w-0">
              <EyeOff className="w-4 h-4 text-[#00c5d7] flex-shrink-0" />
              <span className="text-[11px] text-zinc-300 font-medium whitespace-nowrap flex-shrink-0">
                Độ mờ:
              </span>
              <input
                type="range"
                min="1"
                max="60"
                value={selectedBlurItem.blur || 15}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onChangeBlurOverlays?.(
                    blurOverlays.map((b) => (b.id === selectedBlurItem.id ? { ...b, blur: val } : b))
                  );
                }}
                className="flex-1 accent-[#00c5d7] h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-white bg-zinc-800/90 px-2 py-0.5 rounded border border-white/10 min-w-[42px] text-center flex-shrink-0">
                {selectedBlurItem.blur || 15}px
              </span>
            </div>

            <button
              onClick={() => setActiveBlurTool(null)}
              className="flex-shrink-0 h-[42px] w-[42px] rounded-xl bg-[#00c5d7]/20 border border-[#00c5d7]/50 text-[#00c5d7] hover:bg-[#00c5d7]/30 flex items-center justify-center active:scale-95 transition cursor-pointer"
              title="Xác nhận"
            >
              <Check className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          </div>
        ) : activeBlurTool === 'radius' ? (
          <div className="w-full h-full bg-[#0e0e13] px-3 py-1.5 flex items-center justify-between gap-2.5 animate-in fade-in duration-150 flex-shrink-0">
            <button
              onClick={() => setActiveBlurTool(null)}
              className="flex-shrink-0 h-[42px] px-3 rounded-xl bg-[#181822] hover:bg-[#222230] border border-white/[0.08] flex items-center space-x-1.5 text-zinc-300 hover:text-white active:scale-95 transition cursor-pointer select-none"
              title="Quay lại"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Xong</span>
            </button>

            <div className="flex-1 flex items-center space-x-2.5 px-3 bg-[#16161d] py-1.5 rounded-xl border border-white/[0.06] min-w-0">
              <Square className="w-4 h-4 text-[#00c5d7] rounded-sm flex-shrink-0" />
              <span className="text-[11px] text-zinc-300 font-medium whitespace-nowrap flex-shrink-0">
                Bo góc:
              </span>
              <input
                type="range"
                min="0"
                max="50"
                value={selectedBlurItem.borderRadius || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onChangeBlurOverlays?.(
                    blurOverlays.map((b) => (b.id === selectedBlurItem.id ? { ...b, borderRadius: val } : b))
                  );
                }}
                className="flex-1 accent-[#00c5d7] h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-white bg-zinc-800/90 px-2 py-0.5 rounded border border-white/10 min-w-[42px] text-center flex-shrink-0">
                {selectedBlurItem.borderRadius || 0}px
              </span>
            </div>

            <button
              onClick={() => setActiveBlurTool(null)}
              className="flex-shrink-0 h-[42px] w-[42px] rounded-xl bg-[#00c5d7]/20 border border-[#00c5d7]/50 text-[#00c5d7] hover:bg-[#00c5d7]/30 flex items-center justify-center active:scale-95 transition cursor-pointer"
              title="Xác nhận"
            >
              <Check className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          </div>
        ) : (
          <div className="w-full h-full bg-[#0e0e13] px-2 py-1.5 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0 animate-in fade-in duration-150">
            {/* 1. THOÁT */}
            <button
              onClick={() => {
                if (onSelectBlurOverlay) onSelectBlurOverlay(null);
                setActiveBlurTool(null);
              }}
              className="flex-shrink-0 min-w-[58px] h-[46px] px-2 py-1 rounded-xl bg-[#181822] hover:bg-[#222230] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-300 hover:text-white mr-0.5"
              title="Thoát chỉnh làm mờ"
            >
              <ChevronLeft className="w-4.5 h-4.5 mb-0.5 text-zinc-300" />
              <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Thoát</span>
            </button>

            {/* 2. ĐỘ MỜ */}
            <button
              onClick={() => setActiveBlurTool('blur')}
              className="flex-shrink-0 min-w-[64px] h-[46px] px-2.5 py-1 rounded-xl active:scale-95 border border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white flex flex-col items-center justify-center transition-all cursor-pointer select-none"
              title="Chỉnh độ mờ"
            >
              <EyeOff className="w-4.5 h-4.5 mb-0.5 text-[#00c5d7]" />
              <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
                Độ mờ ({selectedBlurItem.blur || 15}px)
              </span>
            </button>

            {/* 3. ĐỘ BO GÓC */}
            <button
              onClick={() => setActiveBlurTool('radius')}
              className="flex-shrink-0 min-w-[66px] h-[46px] px-2.5 py-1 rounded-xl active:scale-95 border border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white flex flex-col items-center justify-center transition-all cursor-pointer select-none"
              title="Chỉnh độ bo góc"
            >
              <Square className="w-4.5 h-4.5 mb-0.5 text-[#00c5d7] rounded-sm" />
              <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
                Bo góc ({selectedBlurItem.borderRadius || 0}px)
              </span>
            </button>

            {/* 4. XÓA */}
            <button
              onClick={() => {
                if (onChangeBlurOverlays) {
                  onChangeBlurOverlays(blurOverlays.filter((b) => b.id !== selectedBlurItem.id));
                }
                if (onSelectBlurOverlay) onSelectBlurOverlay(null);
                setActiveBlurTool(null);
              }}
              className="flex-shrink-0 min-w-[54px] h-[46px] px-2 py-1 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 active:scale-95 border border-rose-500/30 flex flex-col items-center justify-center transition-all cursor-pointer select-none text-rose-400 hover:text-rose-300"
              title="Xóa vùng làm mờ này"
            >
              <Trash2 className="w-4.5 h-4.5 mb-0.5 text-rose-400" />
              <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Xóa</span>
            </button>
          </div>
        )
      ) : selectedTextItem ? (
        /* CONTEXT-SENSITIVE TEXT / TITLE BLOCK TOOLBAR (< | Sửa | Kiểu chữ | Xóa) */
        <div className="w-full h-full bg-[#0e0e13] px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0 animate-in fade-in duration-150">
          {/* 1. BACK BUTTON <- */}
          <button
            onClick={() => {
              if (onSelectTextOverlay) onSelectTextOverlay(null);
            }}
            className="flex-shrink-0 min-w-[56px] h-[46px] px-2 py-1 rounded-xl bg-[#181822] hover:bg-[#222230] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-300 hover:text-white mr-0.5"
            title="Bỏ chọn văn bản"
          >
            <ChevronLeft className="w-4.5 h-4.5 mb-0.5 text-zinc-300" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Quay lại</span>
          </button>

          {/* 2. SỬA CHỮ */}
          <button
            onClick={handleEditTextOverlay}
            className={`flex-shrink-0 min-w-[58px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              showTextOverlayEditor
                ? 'border-sky-500 bg-sky-500/20 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.3)] font-bold'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Sửa nội dung văn bản"
          >
            <Edit3 className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Sửa</span>
          </button>

          {/* 3. KIỂU CHỮ & MÀU SẮC ĐỘC LẬP */}
          <button
            onClick={handleOpenTextOverlayConfig}
            className={`flex-shrink-0 min-w-[68px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              showTextOverlayConfig
                ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)] font-bold'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Tùy chỉnh font, màu sắc, viền & bóng riêng không đụng phụ đề"
          >
            <Palette className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Kiểu chữ</span>
          </button>

          {/* 4. XÓA */}
          <button
            onClick={handleDeleteTextOverlay}
            className="flex-shrink-0 min-w-[52px] h-[46px] px-2 py-1 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 active:scale-95 border border-rose-500/30 flex flex-col items-center justify-center transition-all cursor-pointer select-none text-rose-400 hover:text-rose-300"
            title="Xóa văn bản này"
          >
            <Trash2 className="w-4.5 h-4.5 mb-0.5 text-rose-400" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Xóa</span>
          </button>
        </div>
      ) : activeGroup === 'subtitles' ? (
        /* NHÓM PHỤ ĐỀ: Gộp Extract, STT, Thêm phụ đề, Dịch, Lọc, Tìm thay thế, Tách dòng, Import SRT, Làm mờ, Kiểu chữ */
        <div className="w-full h-full bg-[#0e0e13] px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0 animate-in fade-in duration-150">
          {/* Quay lại */}
          <button
            onClick={() => setActiveGroup(null)}
            className="flex-shrink-0 min-w-[56px] h-[46px] px-2 py-1 rounded-xl bg-[#181822] hover:bg-[#222230] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-300 hover:text-white mr-0.5"
            title="Quay lại thanh công cụ chính"
          >
            <ChevronLeft className="w-4.5 h-4.5 mb-0.5 text-zinc-300" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Quay lại</span>
          </button>

          {/* 1. Extract (Crop icon matching screenshot) */}
          <button
            onClick={() => onSelectTab(activeTab === 'extract' ? null : 'extract')}
            className={`flex-shrink-0 min-w-[62px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              activeTab === 'extract'
                ? 'border-[#00c5d7]/70 bg-[#00c5d7]/15 text-[#00c5d7] shadow-[0_0_8px_rgba(0,197,215,0.25)]'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Trích xuất phụ đề tự động bằng OCR"
          >
            <Crop className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Extract
            </span>
          </button>

          {/* 1.1. STT (Speech-to-Text CapCut AI) */}
          <button
            onClick={() => onSelectTab(activeTab === 'stt' ? null : 'stt')}
            className={`flex-shrink-0 min-w-[56px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              activeTab === 'stt'
                ? 'border-[#00c5d7]/70 bg-[#00c5d7]/15 text-[#00c5d7] shadow-[0_0_8px_rgba(0,197,215,0.25)]'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Nhận diện giọng nói thành phụ đề bằng CapCut STT"
          >
            <Mic className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              STT
            </span>
          </button>

          {/* 2. Thêm phụ đề */}
          <button
            onClick={onAddSubtitle}
            className="flex-shrink-0 min-w-[70px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Thêm phụ đề thủ công tại thời điểm này"
          >
            <Plus className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Thêm phụ đề
            </span>
          </button>

          {/* 3. Dịch */}
          <button
            onClick={() => onSelectTab(activeTab === 'translate' ? null : 'translate')}
            className={`flex-shrink-0 min-w-[58px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              activeTab === 'translate'
                ? 'border-[#00c5d7]/70 bg-[#00c5d7]/15 text-[#00c5d7] shadow-[0_0_8px_rgba(0,197,215,0.25)]'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Dịch phụ đề bằng AI"
          >
            <Languages className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Dịch
            </span>
          </button>

          {/* 4. Lọc */}
          <button
            onClick={() => onSelectTab(activeTab === 'filters' ? null : 'filters')}
            className={`flex-shrink-0 min-w-[54px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              activeTab === 'filters'
                ? 'border-[#00c5d7]/70 bg-[#00c5d7]/15 text-[#00c5d7] shadow-[0_0_8px_rgba(0,197,215,0.25)]'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Lọc từ khóa / Watermark rác"
          >
            <Filter className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Lọc
            </span>
          </button>

          {/* 5. Tìm & Thay */}
          <button
            onClick={() => onSelectTab(activeTab === 'find_replace' ? null : 'find_replace')}
            className={`flex-shrink-0 min-w-[66px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              activeTab === 'find_replace'
                ? 'border-[#00c5d7]/70 bg-[#00c5d7]/15 text-[#00c5d7] shadow-[0_0_8px_rgba(0,197,215,0.25)]'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Tìm kiếm và thay thế phụ đề"
          >
            <Search className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Tìm & Thay
            </span>
          </button>

          {/* 6. Tách dòng */}
          <button
            type="button"
            onClick={handleSplitMultilineSubtitles}
            className="flex-shrink-0 min-w-[62px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Tự động tách các phụ đề nhiều dòng thành các phụ đề đơn"
          >
            <Scissors className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Tách dòng
            </span>
          </button>

          {/* 7. Import SRT */}
          <button
            type="button"
            onClick={() => srtFileInputRef.current?.click()}
            className="flex-shrink-0 min-w-[66px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Nhập file phụ đề SRT/VTT từ máy"
          >
            <Upload className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Import SRT
            </span>
          </button>

          {/* 8. Làm mờ */}
          <button
            onClick={handleAddBlurOverlay}
            className={`flex-shrink-0 min-w-[60px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              selectedBlurItem
                ? 'border-[#00c5d7]/70 bg-[#00c5d7]/15 text-[#00c5d7] shadow-[0_0_8px_rgba(0,197,215,0.25)]'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Thêm vùng làm mờ video"
          >
            <Layers className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Làm mờ
            </span>
          </button>

          {/* 9. Kiểu chữ */}
          <button
            onClick={() => onSelectTab(activeTab === 'style' ? null : 'style')}
            className={`flex-shrink-0 min-w-[60px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              activeTab === 'style'
                ? 'border-[#00c5d7]/70 bg-[#00c5d7]/15 text-[#00c5d7] shadow-[0_0_8px_rgba(0,197,215,0.25)]'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Cấu hình kiểu dáng, màu sắc phụ đề"
          >
            <Palette className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Kiểu chữ
            </span>
          </button>

          {/* 10. Xuất phụ đề */}
          <button
            type="button"
            onClick={() => setShowSubtitleExportModal(true)}
            className="flex-shrink-0 min-w-[72px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Xuất file phụ đề (SRT, ASS, VTT, TXT)"
          >
            <Download className="w-4.5 h-4.5 mb-0.5 text-cyan-400" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Xuất phụ đề
            </span>
          </button>
        </div>
      ) : activeGroup === 'audio' ? (
        /* NHÓM ÂM THANH: Gộp Audio và Nhập Audio */
        <div className="w-full h-full bg-[#0e0e13] px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0 animate-in fade-in duration-150">
          {/* Quay lại */}
          <button
            onClick={() => setActiveGroup(null)}
            className="flex-shrink-0 min-w-[56px] h-[46px] px-2 py-1 rounded-xl bg-[#181822] hover:bg-[#222230] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-300 hover:text-white mr-0.5"
            title="Quay lại thanh công cụ chính"
          >
            <ChevronLeft className="w-4.5 h-4.5 mb-0.5 text-zinc-300" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Quay lại</span>
          </button>

          {/* 1. Lồng tiếng AI (Mở panel Audio TTS) */}
          <button
            onClick={() => onSelectTab(activeTab === 'audio' ? null : 'audio')}
            className={`flex-shrink-0 min-w-[76px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              activeTab === 'audio'
                ? 'border-[#00c5d7]/70 bg-[#00c5d7]/15 text-[#00c5d7] shadow-[0_0_8px_rgba(0,197,215,0.25)]'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Cấu hình giọng đọc và sinh audio AI cho phụ đề"
          >
            <Volume2 className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Lồng tiếng AI
            </span>
          </button>

          {/* 2. Nhập audio từ máy */}
          <button
            onClick={() => audioFileInputRef.current?.click()}
            className="flex-shrink-0 min-w-[68px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Tải lên file âm thanh MP3, WAV, M4A từ máy"
          >
            <Upload className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Nhập audio
            </span>
          </button>

          {/* 3. Tạo tất cả audio */}
          <button
            onClick={onGenerateAllAudio}
            disabled={isGeneratingAllAudio}
            className="flex-shrink-0 min-w-[68px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Tạo giọng đọc AI hàng loạt cho tất cả phụ đề"
          >
            {isGeneratingAllAudio ? (
              <Loader2 className="w-4.5 h-4.5 mb-0.5 animate-spin text-[#00c5d7]" />
            ) : (
              <Sparkles className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            )}
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              {isGeneratingAllAudio ? 'Đang tạo...' : 'Tạo tất cả'}
            </span>
          </button>

          {/* 4. Xóa tất cả audio */}
          <button
            onClick={onClearAllAudio}
            className="flex-shrink-0 min-w-[62px] h-[46px] px-2 py-1 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 active:scale-95 border border-rose-500/30 flex flex-col items-center justify-center transition-all cursor-pointer select-none text-rose-400 hover:text-rose-300"
            title="Xóa toàn bộ audio đã tạo"
          >
            <VolumeX className="w-4.5 h-4.5 mb-0.5 text-rose-400" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Xóa audio
            </span>
          </button>

          {/* 5. Xuất audio */}
          <button
            type="button"
            onClick={handleExportVoiceoverAudio}
            disabled={isExportingAudio}
            className="flex-shrink-0 min-w-[70px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white disabled:opacity-50"
            title="Xuất file âm thanh thuyết minh đồng bộ (WAV)"
          >
            {isExportingAudio ? (
              <Loader2 className="w-4.5 h-4.5 mb-0.5 animate-spin text-cyan-400" />
            ) : (
              <Download className="w-4.5 h-4.5 mb-0.5 text-cyan-400" />
            )}
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              {isExportingAudio ? 'Đang xuất...' : 'Xuất audio'}
            </span>
          </button>
        </div>
      ) : activeGroup === 'text' ? (
        /* NHÓM VĂN BẢN: Quay lại, Tạo văn bản, Tiêu đề */
        <div className="w-full h-full bg-[#0e0e13] px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0 animate-in fade-in duration-150">
          {/* Quay lại */}
          <button
            onClick={() => setActiveGroup(null)}
            className="flex-shrink-0 min-w-[56px] h-[46px] px-2 py-1 rounded-xl bg-[#181822] hover:bg-[#222230] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-300 hover:text-white mr-0.5"
            title="Quay lại thanh công cụ chính"
          >
            <ChevronLeft className="w-4.5 h-4.5 mb-0.5 text-zinc-300" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">Quay lại</span>
          </button>

          {/* 1. Tạo văn bản (Hiện trên Timeline văn bản) */}
          <button
            onClick={handleCreateTextOverlay}
            className="flex-shrink-0 min-w-[76px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Tạo đoạn văn bản xuất hiện trên Timeline văn bản"
          >
            <Type className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Tạo văn bản
            </span>
          </button>

          {/* 2. Tiêu đề (Mặc định xuyên suốt video, không xuất hiện trên timeline văn bản) */}
          <button
            onClick={handleCreateTitleOverlay}
            className="flex-shrink-0 min-w-[64px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Thêm tiêu đề hiển thị xuyên suốt video (không xuất hiện trên timeline văn bản)"
          >
            <Sparkles className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Tiêu đề
            </span>
          </button>
        </div>
      ) : (
        /* THANH CÔNG CỤ GỐC (ROOT TOOLBAR): PHỤ ĐỀ, VĂN BẢN, THUYẾT MINH, NHẠC NỀN, LOGO */
        <div className="w-full h-full bg-[#0e0e13] px-2 py-1.5 flex items-center justify-around sm:justify-start gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0">
          {/* 1. GROUP PHỤ ĐỀ */}
          <button
            onClick={() => setActiveGroup('subtitles')}
            className="flex-1 sm:flex-initial min-w-[62px] max-w-[85px] sm:w-[74px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Quản lý phụ đề: Extract, Dịch, Lọc, Tách dòng, Import SRT, Làm mờ, Kiểu chữ"
          >
            <Captions className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Phụ đề
            </span>
          </button>

          {/* 2. GROUP VĂN BẢN */}
          <button
            onClick={() => setActiveGroup('text')}
            className="flex-1 sm:flex-initial min-w-[62px] max-w-[85px] sm:w-[74px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Quản lý văn bản: Tạo văn bản timeline, Tiêu đề video, Chỉnh sửa chữ"
          >
            <Type className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Văn bản
            </span>
          </button>

          {/* 3. GROUP THUYẾT MINH */}
          <button
            onClick={() => setActiveGroup('audio')}
            className="flex-1 sm:flex-initial min-w-[62px] max-w-[85px] sm:w-[74px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Thuyết minh / Quản lý âm thanh: Lồng tiếng AI, Nhập file audio, Tạo giọng đọc"
          >
            <Headphones className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Thuyết minh
            </span>
          </button>

          {/* 4. NHẠC NỀN (ẤN VÀO SẼ NHẬP NHẠC NỀN) */}
          <button
            onClick={() => bgMusicFileInputRef.current?.click()}
            className="flex-1 sm:flex-initial min-w-[62px] max-w-[85px] sm:w-[74px] h-[46px] px-2 py-1 rounded-xl bg-[#1c1c24] hover:bg-[#252532] active:scale-95 border border-white/[0.08] flex flex-col items-center justify-center transition-all cursor-pointer select-none text-zinc-200 hover:text-white"
            title="Nhập file nhạc nền cho video (MP3, WAV, AAC...)"
          >
            <Music2 className="w-4.5 h-4.5 mb-0.5 text-zinc-200" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              {bgMusicTitle ? 'Đổi nhạc' : 'Nhạc nền'}
            </span>
          </button>

          {/* 5. GROUP LOGO */}
          <button
            onClick={() => {
              onSelectTab(activeTab === 'overlays' && filtersSubTab === 'logo' ? null : 'overlays');
              setFiltersSubTab('logo');
            }}
            className={`flex-1 sm:flex-initial min-w-[62px] max-w-[85px] sm:w-[74px] h-[46px] px-2 py-1 rounded-xl active:scale-95 border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              activeTab === 'overlays' && filtersSubTab === 'logo'
                ? 'border-[#00c5d7]/70 bg-[#00c5d7]/15 text-[#00c5d7] shadow-[0_0_8px_rgba(0,197,215,0.25)]'
                : 'border-white/[0.08] bg-[#1c1c24] hover:bg-[#252532] text-zinc-200 hover:text-white'
            }`}
            title="Chèn và quản lý Logo / Watermark"
          >
            <Image className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10.5px] font-medium leading-none whitespace-nowrap">
              Logo
            </span>
          </button>
        </div>
      )}

      {/* Hidden file inputs for SRT, Audio, and Background Music */}
      <input
        ref={srtFileInputRef}
        type="file"
        accept=".srt,.vtt,.txt"
        className="hidden"
        onChange={handleSrtFileChange}
      />
      <input
        ref={audioFileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleAudioFileChange}
      />
      <input
        ref={bgMusicFileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleBgMusicFileChange}
      />
      <input
        id="direct-logo-toolbar-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleAddLogoOverlay(file);
            onSelectTab('overlays');
            setFiltersSubTab('logo');
          }
          e.target.value = '';
        }}
      />

      {/* OCR Quick Help Modal */}
      {showOcrHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1e1e22] border border-zinc-700/80 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sky-400" />
                <span>Hướng dẫn bóc tách phụ đề (OCR)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOcrHelpModal(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <p>
                  <strong className="text-white">Điều chỉnh vùng quét:</strong> Kéo và thu phóng khung viền nét đứt màu xanh trên màn hình xem trước để bao trọn vùng xuất hiện dòng chữ phụ đề gốc.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <p>
                  <strong className="text-white">Chọn khung hình chuẩn:</strong> Kéo thanh thời gian video đến một khung hình có hiển thị rõ câu phụ đề chính trước khi bấm bóc tách.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <p>
                  <strong className="text-white">Cấu hình chế độ:</strong> Chọn đúng ngôn ngữ gốc của video, chọn chế độ <em>Nhanh</em> hoặc <em>Kỹ</em>, và điều chỉnh độ mạnh lọc chữ nền (tiêu chuẩn khuyên dùng 40%).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <p>
                  <strong className="text-white">Bắt đầu bóc tách:</strong> Nhấn nút <strong className="text-sky-400">BẮT ĐẦU BÓC TÁCH</strong>. Hệ thống sẽ tự động quét, trích xuất và đồng bộ thời gian phụ đề vào timeline.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOcrHelpModal(false)}
              className="w-full py-2.5 bg-[#0095f6] hover:bg-[#0087e0] text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Subtitle Export Modal */}
      {showSubtitleExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181f] border border-white/10 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Xuất File Phụ Đề</h3>
                  <p className="text-[11px] text-zinc-400">{subtitles.length} câu phụ đề sẵn sàng xuất</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubtitleExportModal(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of formats */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {/* Option 1: SRT Bản dịch */}
              <div className="p-3 rounded-xl bg-[#22222b] hover:bg-[#282834] border border-white/5 flex items-center justify-between gap-3 transition">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    SRT
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">SRT (Bản dịch tiếng Việt)</h4>
                    <p className="text-[11px] text-zinc-400 leading-normal mt-0.5">
                      Định dạng chuẩn phổ biến nhất, chứa toàn bộ câu phụ đề đã dịch trên video.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportSubtitleFile('srt_trans')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition cursor-pointer"
                >
                  Tải về
                </button>
              </div>

              {/* Option 2: SRT Bản gốc */}
              <div className="p-3 rounded-xl bg-[#22222b] hover:bg-[#282834] border border-white/5 flex items-center justify-between gap-3 transition">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    SRT
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">SRT (Bản gốc trích xuất)</h4>
                    <p className="text-[11px] text-zinc-400 leading-normal mt-0.5">
                      Chứa các câu phụ đề nguyên bản bóc tách từ video gốc (Tiếng Trung, Anh, Nhật...).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportSubtitleFile('srt_orig')}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shrink-0 transition cursor-pointer"
                >
                  Tải về
                </button>
              </div>

              {/* Option 3: ASS Nâng cao */}
              <div className="p-3 rounded-xl bg-[#22222b] hover:bg-[#282834] border border-white/5 flex items-center justify-between gap-3 transition">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ASS
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">ASS (SubStation Alpha - Giữ kiểu dáng)</h4>
                    <p className="text-[11px] text-zinc-400 leading-normal mt-0.5">
                      Giữ nguyên màu chữ, viền nét, cỡ chữ, phông chữ và vị trí căn chỉnh.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportSubtitleFile('ass')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition cursor-pointer"
                >
                  Tải về
                </button>
              </div>

              {/* Option 4: VTT */}
              <div className="p-3 rounded-xl bg-[#22222b] hover:bg-[#282834] border border-white/5 flex items-center justify-between gap-3 transition">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    VTT
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">VTT (WebVTT - Chuẩn HTML5)</h4>
                    <p className="text-[11px] text-zinc-400 leading-normal mt-0.5">
                      Tương thích hoàn hảo để phát trên nền tảng web, YouTube và mạng xã hội.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportSubtitleFile('vtt')}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 transition cursor-pointer"
                >
                  Tải về
                </button>
              </div>

              {/* Option 5: TXT */}
              <div className="p-3 rounded-xl bg-[#22222b] hover:bg-[#282834] border border-white/5 flex items-center justify-between gap-3 transition">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-600/30 text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    TXT
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">TXT (Văn bản kịch bản thô)</h4>
                    <p className="text-[11px] text-zinc-400 leading-normal mt-0.5">
                      Toàn bộ lời thoại liên tục không chứa mốc thời gian, thuận tiện đọc và duyệt kịch bản.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportSubtitleFile('txt')}
                  className="px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold shrink-0 transition cursor-pointer"
                >
                  Tải về
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audio export success toast */}
      {audioExportSuccess && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold border border-emerald-400/30 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{audioExportSuccess}</span>
        </div>
      )}
    </div>
  );
};
