function trimTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}

export function getAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

  if (configured) {
    return trimTrailingSlash(configured);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('APP URL is not configured. Set NEXT_PUBLIC_APP_URL or APP_URL.');
  }

  return 'http://localhost:8080';
}
