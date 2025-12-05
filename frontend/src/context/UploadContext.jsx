import { createContext, useContext, useState } from 'react';

const UploadContext = createContext(null);
const STORAGE_KEY = 'smartpls-upload-state';

function loadInitialUploadState() {
  if (typeof window === 'undefined') {
    return { fileName: '', result: null, savedFile: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { fileName: '', result: null, savedFile: null };

    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        fileName: parsed.fileName || '',
        result: parsed.result || null,
        savedFile: null, // File object không thể lưu vào localStorage
      };
    }
  } catch {
    // ignore parse errors and fallback
  }

  return { fileName: '', result: null, savedFile: null };
}

export function UploadProvider({ children }) {
  const [uploadState, setUploadStateInner] = useState(loadInitialUploadState);

  const setUploadState = (next) => {
    setUploadStateInner((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      try {
        if (typeof window !== 'undefined') {
          // Chỉ lưu fileName và result vào localStorage, không lưu File object
          const toStore = {
            fileName: value.fileName || '',
            result: value.result || null,
          };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
        }
      } catch {
        // ignore storage errors
      }
      return value;
    });
  };

  const value = {
    uploadState,
    setUploadState,
  };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return ctx;
}


