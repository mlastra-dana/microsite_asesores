export function getMicrositeUrl(pathname: string) {
  if (typeof window === 'undefined') {
    return pathname;
  }

  return `${window.location.origin}${pathname}`;
}

export function createQrSeed(value: string) {
  return Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0);
}
