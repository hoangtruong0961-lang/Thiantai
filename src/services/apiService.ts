import axios from 'axios';
import { GenDownloadResponse } from '../types';

export const fetchDownloadLinks = async (videoUrl: string): Promise<GenDownloadResponse> => {
  try {
    // Gọi qua Backend của bạn (/api/download) để ẩn API Key và tránh lỗi CORS
    const response = await axios.post<GenDownloadResponse>('/api/download', {
      url: videoUrl
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: 'Không thể kết nối đến máy chủ hoặc link không hợp lệ.'
    };
  }
};

/**
 * Douyin Auth Handoff APIs
 */
export const createDouyinHandoffApi = async (seriesId: number, targetAppId?: string) => {
  const res = await axios.post('/api/douyin-handoff/create', { seriesId, targetAppId });
  return res.data;
};

export const pollDouyinHandoffApi = async (handoffId: string, pollToken: string) => {
  const res = await axios.get(`/api/douyin-handoff/poll/${encodeURIComponent(handoffId)}`, {
    params: { pollToken },
  });
  return res.data;
};

export const completeDouyinHandoffApi = async (handoffId: string, completeNonce: string, miniappLoginCode: string) => {
  const res = await axios.post(`/api/douyin-handoff/complete/${encodeURIComponent(handoffId)}`, {
    completeNonce,
    miniappLoginCode,
  });
  return res.data;
};

export const createDirectSessionApi = async (token: string, userId: string, appId?: string) => {
  const res = await axios.post('/api/douyin-handoff/direct-session', { token, userId, appId });
  return res.data;
};

export const createGuestAutoSessionApi = async (userId?: string) => {
  const res = await axios.post('/api/douyin-handoff/guest-auto-auth', { userId });
  return res.data;
};

export const analyzeDouyinHandoffSeriesApi = async (downloadSession: string, shareUrl: string) => {
  const res = await axios.post('/api/douyin-handoff/analyze', { shareUrl }, {
    headers: { Authorization: `Bearer ${downloadSession}` },
  });
  return res.data;
};

export const resolveDouyinHandoffMediaApi = async (
  downloadSession: string,
  seriesId: number,
  episode: number,
  videoId?: number,
  appId?: string
) => {
  const res = await axios.post('/api/douyin-handoff/resolve-media', {
    seriesId,
    episode,
    videoId,
    appId,
  }, {
    headers: { Authorization: `Bearer ${downloadSession}` },
  });
  return res.data;
};

export const parseDouyinShareLinkApi = async (shareUrl: string) => {
  const res = await axios.post('/api/douyin-handoff/parse-share-link', { shareUrl });
  return res.data;
};

export const getDouyinCapabilitiesApi = async () => {
  const res = await axios.get('/api/douyin-handoff/capabilities');
  return res.data;
};

