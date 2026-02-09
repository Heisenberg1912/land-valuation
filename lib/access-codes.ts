/**
 * Access code validation for Pro tier access
 * Reads from ACCESS_CODES environment variable (comma-separated)
 */

let cachedCodes: string[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Load access codes from environment variable
 * Cached for performance
 */
function loadAccessCodes(): string[] {
  const now = Date.now();

  // Return cached codes if still valid
  if (cachedCodes && (now - lastCacheTime) < CACHE_TTL) {
    return cachedCodes;
  }

  const codesEnv = process.env.ACCESS_CODES || "";

  // Parse comma-separated codes, trim whitespace, filter empty
  cachedCodes = codesEnv
    .split(",")
    .map(code => code.trim())
    .filter(code => code.length > 0);

  lastCacheTime = now;

  return cachedCodes;
}

/**
 * Check if an access code is valid
 * Returns true if the code matches one of the valid codes
 */
export function isValidAccessCode(code: string | null | undefined): boolean {
  if (!code || typeof code !== "string" || !code.trim()) {
    return false;
  }

  const validCodes = loadAccessCodes();
  const normalizedCode = code.trim();

  return validCodes.includes(normalizedCode);
}

/**
 * Get the count of valid access codes (for admin purposes)
 */
export function getAccessCodeCount(): number {
  return loadAccessCodes().length;
}
