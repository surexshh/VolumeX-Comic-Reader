/**
 * BackgroundContext — provides a global "cinematic background" source
 * consumed by DynamicBackgroundEngine and set by Library / RecentPage.
 */
import { createContext, useCallback, useContext, useState } from "react";

interface BackgroundContextValue {
  src:    string | null;
  setSrc: (url: string | null) => void;
}

const BackgroundContext = createContext<BackgroundContextValue>({
  src:    null,
  setSrc: () => {},
});

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [src, setSrcRaw] = useState<string | null>(null);
  const setSrc = useCallback((url: string | null) => setSrcRaw(url), []);

  return (
    <BackgroundContext.Provider value={{ src, setSrc }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  return useContext(BackgroundContext);
}
