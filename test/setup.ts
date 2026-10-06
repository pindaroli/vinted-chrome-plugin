import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Pulizia del DOM dopo ogni test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock in-memory dello storage locale di Chrome
const storageStore: Record<string, unknown> = {};

// Mock globale delle API di Chrome Extension
const chromeMock = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[], callback?: (items: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const k of keyList) {
          if (storageStore[k] !== undefined) {
            result[k] = storageStore[k];
          }
        }
        if (callback) callback(result);
        return Promise.resolve(result);
      }),
      set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
        Object.assign(storageStore, items);
        if (callback) callback();
        return Promise.resolve();
      }),
      clear: vi.fn((callback?: () => void) => {
        for (const k of Object.keys(storageStore)) {
          delete storageStore[k];
        }
        if (callback) callback();
        return Promise.resolve();
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
    lastError: null,
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([])),
    sendMessage: vi.fn(),
    onActivated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  sidePanel: {
    setPanelBehavior: vi.fn(() => Promise.resolve()),
  },
};

// Inietta chrome in globalThis
vi.stubGlobal('chrome', chromeMock);
