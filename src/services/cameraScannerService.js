export const DEFAULT_CAMERA_BARCODE_TYPES = ['qr', 'code128', 'code39', 'code93', 'codabar'];

const parseIdFromQueryString = (payload = '') => {
  const queryMatch = String(payload).match(/[?&](?:itemId|productId|id)=([^&#]+)/i);
  return queryMatch?.[1] ? decodeURIComponent(queryMatch[1]) : null;
};

const parseDirectNumericId = (payload = '') => (/^\d+$/.test(String(payload).trim()) ? String(payload).trim() : null);

const parseFromRawValue = (payload = '') => {
  const normalizedPayload = String(payload || '').trim();
  if (!normalizedPayload) {
    return null;
  }

  return parseIdFromQueryString(normalizedPayload) || parseDirectNumericId(normalizedPayload) || normalizedPayload;
};

export const resolveScannerPayload = (scanResult) => {
  if (!scanResult) {
    return '';
  }

  if (typeof scanResult === 'string') {
    return scanResult;
  }

  if (typeof scanResult === 'object') {
    return scanResult.data || '';
  }

  return '';
};

export const getItemIdFromScan = (scanResult, parsers = []) => {
  const payload = String(resolveScannerPayload(scanResult)).trim();
  if (!payload) {
    return null;
  }

  const parserList = Array.isArray(parsers) ? parsers.filter((parser) => typeof parser === 'function') : [];
  for (const parser of parserList) {
    const result = parser(payload);
    if (result) {
      return String(result).trim();
    }
  }

  return parseFromRawValue(payload);
};
