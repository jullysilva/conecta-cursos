/** Reads a boolean preference saved as '1' / '0'. Storage may be unavailable (private mode). */
export function readStoredFlag(key: string, fallback = false): boolean {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === '1';
  } catch {
    return fallback;
  }
}

/** Saves a boolean preference; without storage it simply lasts for the current page. */
export function writeStoredFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // Storage unavailable: the in-memory state still applies.
  }
}
