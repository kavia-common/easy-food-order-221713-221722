export function isCouponValid(code?: string): boolean {
  if (!code) return false;
  const norm = code.trim().toUpperCase();
  const valid = ['WELCOME10', 'SAVE10', 'OCEAN10'];
  return valid.includes(norm);
}
