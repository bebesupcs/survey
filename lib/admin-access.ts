export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
export function validEmail(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}
export function hasAdminAccess(
  email: string,
  owner: string,
  initial: string[],
  override: number | null,
) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  if (normalized === normalizeEmail(owner)) return true;
  return override === null
    ? initial.map(normalizeEmail).includes(normalized)
    : override === 1;
}
