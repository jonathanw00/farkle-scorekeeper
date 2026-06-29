// Minimal storage adapter that mirrors the Claude-artifact `window.storage`
// API shape (get/set/delete/list), but backed by the browser's localStorage.
// This lets components written for artifacts run unmodified-ish in a normal
// web app — just swap the import. Reusable across future small projects.

const PREFIX = "app:";

export const storage = {
  async get(key) {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) {
      throw new Error(`Key not found: ${key}`);
    }
    return { key, value: raw };
  },

  async set(key, value) {
    localStorage.setItem(PREFIX + key, value);
    return { key, value };
  },

  async delete(key) {
    localStorage.removeItem(PREFIX + key);
    return { key, deleted: true };
  },

  async list(prefix = "") {
    const fullPrefix = PREFIX + prefix;
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(fullPrefix))
      .map((k) => k.slice(PREFIX.length));
    return { keys };
  },
};
