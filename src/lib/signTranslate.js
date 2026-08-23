const ENDPOINT = 'https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose';

const cache = new Map();

export async function translateToSign(text, options = {}) {
  const { spoken = 'en', signed = 'ase', force = false } = options;

  const cacheKey = `${spoken}|${signed}|${text}`;
  if (!force && cache.has(cacheKey)) {
    console.info(`[signTranslate] cache hit (API not called): "${text}"`);
    return cache.get(cacheKey);
  }

  const url = `${ENDPOINT}?text=${encodeURIComponent(text)}&spoken=${encodeURIComponent(spoken)}&signed=${encodeURIComponent(signed)}`;

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    throw new Error(
      [
        '[signTranslate] The request failed before any response arrived.',
        offline
          ? 'The browser reports being OFFLINE.'
          : 'This is either a network failure OR the browser blocked the request (CORS).',
        'If it only fails in the browser while curl works, the endpoint is not allowing cross-origin requests',
        'and we need a serverless proxy instead of calling it directly.',
        `Original error: ${error.message}`,
      ].join(' ')
    );
  }

  if (!response.ok) {
    throw new Error(`[signTranslate] Endpoint returned HTTP ${response.status} ${response.statusText} for "${text}"`);
  }

  const contentType = response.headers.get('content-type') ?? 'unknown';
  let data;
  if (contentType.includes('json')) {
    data = await response.json();
  } else {
    data = await response.blob();
  }

  console.log('[signTranslate] RAW RESPONSE', {
    url,
    status: response.status,
    contentType,
    dataType: data instanceof Blob ? `Blob(${data.size} bytes)` : typeof data,
    disposition: response.headers.get('content-disposition'),
    data,
  });

  const result = { text, spoken, signed, contentType, data };
  cache.set(cacheKey, result);
  return result;
}

export function clearTranslationCache() {
  cache.clear();
}
