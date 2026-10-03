export function normalizePhoneNumber(phone) {
  const value = String(phone || "").trim();
  if (!value) return "";
  const hasPlus = value.startsWith("+");
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

export function isValidPhoneNumber(phone) {
  return /^\+[1-9]\d{9,14}$/.test(phone);
}
