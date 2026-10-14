import crypto from 'node:crypto';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Short human-friendly reference such as SLF-261011-AB2CD. */
export function generateReference(prefix, date = new Date()) {
  const ymd = date.toISOString().slice(2, 10).replace(/-/g, '');
  const bytes = crypto.randomBytes(5);
  const code = Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
  return `${prefix}-${ymd}-${code}`;
}
