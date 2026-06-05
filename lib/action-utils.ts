export function assertFestivalMatch(actualFestivalId: string, expectedFestivalId: string) {
  if (actualFestivalId !== expectedFestivalId) {
    throw new Error("אי התאמה בין משאב לפסטיבל");
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function requireString(formData: FormData, key: string, label: string, maxLength = 200): string {
  const value = readString(formData, key);
  if (!value) throw new Error(`${label} הוא שדה חובה`);
  if (value.length > maxLength) throw new Error(`${label} ארוך מדי`);
  return value;
}

export function optionalString(value: unknown, maxLength = 1000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function optionalEmail(value: unknown): string | null {
  const email = optionalString(value, 320);
  if (!email) return null;
  const normalized = email.toLowerCase();
  if (!EMAIL_RE.test(normalized)) throw new Error("כתובת האימייל לא תקינה");
  return normalized;
}

export function parseAmount(value: unknown, label: string): number {
  if (typeof value !== "string") throw new Error(`${label} חייב להיות מספר`);
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`${label} חייב להיות מספר תקין`);
  return amount;
}
