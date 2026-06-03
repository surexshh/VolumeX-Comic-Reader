import { useCallback, useEffect, useState } from "react";

type Listener = () => void;
const listeners = new Set<Listener>();
let connectedProviders: string[] = [];

async function loadCloudState() {
  connectedProviders = await window.api.cloudGetConnected();
  listeners.forEach((l) => l());
}

export function useCloud() {
  const [, set] = useState(0);

  useEffect(() => {
    const fn = () => set((v) => v + 1);
    listeners.add(fn);
    loadCloudState(); // Load on mount
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const login = useCallback(async (provider: string) => {
    try {
      await window.api.cloudLogin(provider);
      await loadCloudState();
    } catch (err) {
      console.error(`Failed to login to ${provider}:`, err);
      throw err;
    }
  }, []);

  const logout = useCallback(async (provider: string) => {
    await window.api.cloudLogout(provider);
    await loadCloudState();
  }, []);

  return {
    connected: connectedProviders,
    login,
    logout,
  };
}

// Global initialization
loadCloudState();
