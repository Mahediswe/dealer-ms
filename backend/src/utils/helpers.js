export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function generateCode(prefix) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${stamp}${rand}`;
}

// Convert a decimal amount (e.g. taka) to integer minor units (paisa)
export function toMinor(amount) {
  return Math.round(Number(amount || 0) * 100);
}

export function toMajor(minor) {
  return Number(minor || 0) / 100;
}
