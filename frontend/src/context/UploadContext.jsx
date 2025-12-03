import { createContext, useContext, useState } from 'react';

const UploadContext = createContext(null);

export function UploadProvider({ children }) {
  const [uploadState, setUploadState] = useState({
    fileName: '',
    result: null,
  });

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


