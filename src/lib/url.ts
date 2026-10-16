/** Prefixes site-relative paths with the configured base (GitHub Pages project path). */
export function url(path: string): string {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (path.startsWith('/') ? path : '/' + path);
}

export const EMAIL = 'anna.shevchenko.20042015@gmail.com';
export const CV_URL = 'https://docs.google.com/document/d/1WiEn4m7vF1AwVd9WYD8QIVhUFJTEkMI9Howa8WtqWp8/edit?usp=sharing';
export const GITHUB_URL = 'https://github.com/xshevc02';
