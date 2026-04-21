export function getSiteUrl(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    'http://localhost:3000';

  return siteUrl.startsWith('http') ? siteUrl.replace(/\/$/, '') : `https://${siteUrl.replace(/\/$/, '')}`;
}

export function getPayloadOrigin(): string | null {
  const apiUrl = process.env.PAYLOAD_API_URL?.trim();

  if (!apiUrl) {
    return null;
  }

  try {
    return new URL(apiUrl).origin;
  } catch {
    return null;
  }
}

export function toAbsoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${getSiteUrl()}${normalizedPath}`;
}

export function toAbsoluteMediaUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const origin = getPayloadOrigin() ?? getSiteUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${origin}${normalizedPath}`;
}
