import NativeGeminiWebView, { isNativeGeminiWebViewSupported } from '../plugins/geminiWebView';

export interface ParsedGoogleCookies {
  psid: string;
  psidts?: string;
  psidcc?: string;
  cleanCookieHeader: string;
  isValid: boolean;
}

/**
 * Parses user input cookie string into structured cookies (works in both Browser and Node.js environments)
 */
export function parseGoogleCookies(rawCookieStr: string): ParsedGoogleCookies {
  if (!rawCookieStr || typeof rawCookieStr !== 'string') {
    return { psid: '', cleanCookieHeader: '', isValid: false };
  }

  const cookieMap = new Map<string, string>();
  const pairs = rawCookieStr.split(';');

  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const key = pair.substring(0, idx).trim();
      const val = pair.substring(idx + 1).trim();
      if (key && val) {
        cookieMap.set(key, val);
      }
    }
  }

  // Common Google session authentication keys
  const psid = cookieMap.get('__Secure-1PSID') || cookieMap.get('__Secure-3PSID') || cookieMap.get('SID') || '';
  const psidts = cookieMap.get('__Secure-1PSIDTS') || cookieMap.get('__Secure-3PSIDTS') || '';
  const psidcc = cookieMap.get('__Secure-1PSIDCC') || cookieMap.get('__Secure-3PSIDCC') || '';

  const standardPairs: string[] = [];
  cookieMap.forEach((v, k) => {
    standardPairs.push(`${k}=${v}`);
  });

  return {
    psid,
    psidts,
    psidcc,
    cleanCookieHeader: standardPairs.join('; '),
    isValid: !!psid
  };
}

/**
 * Parses Google RPC stream response
 */
export function parseGeminiWebStreamResponse(responseText: string): string {
  if (!responseText || typeof responseText !== 'string') return '';

  const lines = responseText.split('\n');
  let accumulatedText = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(")]}'")) continue;

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (Array.isArray(item) && item[0] === 'wrb.fr') {
            const dataStr = item[2];
            if (typeof dataStr === 'string') {
              try {
                const subData = JSON.parse(dataStr);
                if (Array.isArray(subData) && subData[4]) {
                  const candidateList = subData[4];
                  if (Array.isArray(candidateList) && candidateList[0] && Array.isArray(candidateList[0][1])) {
                    const textParts = candidateList[0][1];
                    if (typeof textParts[0] === 'string') {
                      accumulatedText = textParts[0];
                    }
                  }
                }
              } catch (_) {}
            }
          }
        }
      }
    } catch (_) {}
  }

  if (!accumulatedText.trim()) {
    const textMatches = responseText.match(/\\n\\n([^\\]+)\\n/g);
    if (textMatches && textMatches.length > 0) {
      const last = textMatches[textMatches.length - 1].replace(/\\n/g, '\n').trim();
      if (last.length > 3) {
        accumulatedText = last;
      }
    }
  }

  return accumulatedText.trim();
}

/**
 * Executes a prompt via Google Gemini Web either natively on Android (no CORS restriction)
 * or through the backend proxy server.
 */
export async function executeGeminiWebPromptHybrid(
  prompt: string,
  options: {
    cookie: string;
    snlm0e?: string;
  }
): Promise<{ success: boolean; text?: string; snlm0e?: string; error?: string; logs?: string[] }> {
  const logs: string[] = [];
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    logs.push(`[${time}] ${msg}`);
  };

  if (!options.cookie || !options.cookie.trim()) {
    return { success: false, error: 'Thiếu Cookie Google (__Secure-1PSID)', logs };
  }

  // 1. If running on native Android APK (Capacitor), execute directly via Android native plugin
  if (isNativeGeminiWebViewSupported()) {
    try {
      addLog('[GeminiNative RPC] Đang gửi yêu cầu trực tiếp qua Android Native Engine...');
      const nativeRes = await NativeGeminiWebView.executeGeminiPrompt({
        prompt,
        cookies: options.cookie.trim(),
        snlm0e: options.snlm0e
      });

      if (nativeRes.success && nativeRes.text) {
        addLog('[GeminiNative RPC] Nhận phản hồi thành công từ Google Web.');
        return {
          success: true,
          text: nativeRes.text,
          snlm0e: nativeRes.snlm0e || options.snlm0e,
          logs
        };
      } else {
        addLog(`[GeminiNative RPC Warning] ${nativeRes.error || 'Thử qua server proxy...'}`);
      }
    } catch (nativeErr: any) {
      addLog(`[GeminiNative RPC Err] ${nativeErr.message || 'Lỗi plugin'}`);
    }
  }

  // 2. Fallback or Web Mode: Call /api/gemini-web/execute-prompt
  try {
    addLog('[GeminiWeb Service] Gửi yêu cầu qua máy chủ proxy...');
    const res = await fetch('/api/gemini-web/execute-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        cookie: options.cookie.trim()
      })
    });

    const rawText = await res.text().catch(() => '');
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`Máy chủ không phản hồi JSON hợp lệ: ${rawText.slice(0, 100)}`);
    }

    if (data.logs && Array.isArray(data.logs)) {
      data.logs.forEach((l: string) => logs.push(l));
    }

    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return {
      success: true,
      text: data.text,
      logs
    };
  } catch (err: any) {
    addLog(`[GeminiWeb Service Error] ${err.message || 'Lỗi kết nối'}`);
    return {
      success: false,
      error: err.message || 'Lỗi kết nối dịch vụ Gemini Web',
      logs
    };
  }
}

/**
 * Translates a chunk of subtitles using Gemini Web (Direct RPC Native / Proxy fallback)
 */
export async function translateSubtitleChunkWithGeminiWeb(
  subtitles: { id: string; originalText: string; startTime?: number; endTime?: number }[],
  targetLang: string,
  options: {
    cookie: string;
    snlm0e?: string;
    globalContext?: any;
    glossary?: any[];
    previousContext?: any[];
    customContext?: string;
    optimizeForTts?: boolean;
  }
): Promise<{
  success: boolean;
  translations: { id: string; translatedText: string }[];
  newEntities?: any[];
  error?: string;
}> {
  if (!subtitles || subtitles.length === 0) {
    return { success: true, translations: [] };
  }

  const { globalContext, glossary, previousContext, customContext, optimizeForTts = true } = options;

  const ttsInstruction = optimizeForTts
    ? '\nCRITICAL BREVITY REQUIREMENT: Keep each translated subtitle natural, punchy, and concise (under maxLength characters) so dubbing audio does not overflow.'
    : '';

  let globalGenreSection = '';
  if (globalContext && (globalContext.movieGenre || globalContext.characterPronounGuide)) {
    globalGenreSection = `
=== 1. GLOBAL MOVIE GENRE & STYLE RULES ===
- Thể loại phim: ${globalContext.movieGenre || 'Chưa xác định'}
- Thời đại & Bối cảnh: ${globalContext.eraAndSetting || 'Tự nhiên'}
${globalContext.summary ? `- Tóm tắt: ${globalContext.summary}` : ''}
- QUY TẮC ĐẠI TỪ NHÂN XƯNG: ${globalContext.characterPronounGuide || 'Xưng hô linh hoạt, tự nhiên theo quan hệ nhân vật.'}`;
  }

  let glossarySection = '';
  if (Array.isArray(glossary) && glossary.length > 0) {
    const entries = glossary
      .map((g: any) => `- "${g.original}" -> "${g.translated}" (${g.type || 'term'})`)
      .join('\n');
    glossarySection = `
=== 2. KNOWN ENTITY GLOSSARY (BẮT BUỘC DỊCH ĐÚNG) ===
${entries}`;
  }

  let prevContextSection = '';
  if (Array.isArray(previousContext) && previousContext.length > 0) {
    const prevLines = previousContext
      .map((p: any) => `[Câu trước] Gốc: "${p.originalText || ''}" -> Đã dịch: "${p.translatedText || ''}"`)
      .join('\n');
    prevContextSection = `
=== 3. PREVIOUS CONTEXT ===
${prevLines}`;
  }

  let userNotesSection = '';
  if (customContext && customContext.trim()) {
    userNotesSection = `
=== 4. GHI CHÚ BỔ SUNG ===
${customContext.trim()}`;
  }

  const subtitleItems = subtitles.map((s) => {
    const durSec = Math.max(0.5, ((s.endTime || 0) - (s.startTime || 0)) || 2.0);
    const maxLen = Math.max(14, Math.floor(durSec * 16));
    return {
      id: s.id,
      originalText: s.originalText,
      maxLength: maxLen,
    };
  });

  const prompt = `You are a professional film and video dialogue translator.
Translate the following list of subtitles into ${targetLang}.${globalGenreSection}${glossarySection}${prevContextSection}${userNotesSection}${ttsInstruction}

MANDATORY OUTPUT CONSTRAINTS:
1. "translatedText" must contain ONLY the spoken dialogue sentence in ${targetLang}.
2. Output strictly a JSON array or JSON object matching: {"translations": [{"id": string, "translatedText": string}]}.
3. DO NOT output markdown explanation outside JSON.

=== SUBTITLES TO TRANSLATE ===
${JSON.stringify(subtitleItems)}`;

  const result = await executeGeminiWebPromptHybrid(prompt, {
    cookie: options.cookie,
    snlm0e: options.snlm0e,
  });

  if (!result.success || !result.text) {
    return {
      success: false,
      translations: [],
      error: result.error || 'Không nhận được kết quả từ Gemini Web',
    };
  }

  let cleanText = result.text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  // Parse JSON structure
  let parsed: any = null;
  try {
    parsed = JSON.parse(cleanText);
  } catch {
    // Try regex array search
    const arrMatch = cleanText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrMatch) {
      try {
        parsed = JSON.parse(arrMatch[0]);
      } catch (_) {}
    }
  }

  const translationsList: { id: string; translatedText: string }[] = [];
  const rawList = Array.isArray(parsed)
    ? parsed
    : (Array.isArray(parsed?.translations) ? parsed.translations : []);

  if (Array.isArray(rawList) && rawList.length > 0) {
    rawList.forEach((item: any) => {
      if (item && item.id) {
        translationsList.push({
          id: String(item.id),
          translatedText: String(item.translatedText || item.translation || '').trim(),
        });
      }
    });
  }

  // If parsed list is empty, fallback to 1-to-1 line mapping
  if (translationsList.length === 0) {
    const lines = cleanText.split('\n').filter((l) => l.trim().length > 0);
    subtitles.forEach((s, idx) => {
      translationsList.push({
        id: s.id,
        translatedText: lines[idx] || s.originalText,
      });
    });
  }

  return {
    success: true,
    translations: translationsList,
    newEntities: Array.isArray(parsed?.newEntities) ? parsed.newEntities : [],
  };
}

