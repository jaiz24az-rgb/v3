// A robust wrapper for localStorage to handle security errors when local storage is blocked
// (e.g., in Chrome mobile under restricted settings or inside iframe environments)

const inMemoryStorage: Record<string, string> = {};

// Test if localStorage is available and writable
let isLocalStorageAvailable = false;
try {
  const testKey = '__storage_test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
  isLocalStorageAvailable = true;
} catch (e) {
  isLocalStorageAvailable = false;
  console.warn('localStorage is blocked or not available in this browser environment. Falling back to in-memory storage.');
}

export const safeStorage = {
  getItem(key: string): string | null {
    if (isLocalStorageAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        // Fallback
      }
    }
    return key in inMemoryStorage ? inMemoryStorage[key] : null;
  },

  setItem(key: string, value: string): void {
    if (isLocalStorageAvailable) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        // Fallback
      }
    }
    inMemoryStorage[key] = String(value);
  },

  removeItem(key: string): void {
    if (isLocalStorageAvailable) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {
        // Fallback
      }
    }
    delete inMemoryStorage[key];
  },

  clear(): void {
    if (isLocalStorageAvailable) {
      try {
        window.localStorage.clear();
        return;
      } catch (e) {
        // Fallback
      }
    }
    for (const key in inMemoryStorage) {
      delete inMemoryStorage[key];
    }
  }
};
