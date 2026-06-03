/**
 * Renderer-side library store. Persists via the main process electron-store.
 */
import { useCallback, useEffect, useState } from "react";

export interface LibraryItem {
  id: string;
  filePath: string;
  title: string;
  kind: "cbz" | "cbr" | "pdf" | "folder";
  size: number;
  pageCount?: number;
  thumbnail?: string;
  currentPage: number;
  addedAt: number;
  lastReadAt?: number;
  bookmarks: number[];
  isBookmarked?: boolean;
}

type Listener = () => void;
const listeners = new Set<Listener>();
export let cache: LibraryItem[] = [];
export let settingsCache: Settings | null = null;

export async function load(): Promise<LibraryItem[]> {
  const data = (await window.api.storeGet<LibraryItem[]>("library")) ?? [];
  cache = data;
  listeners.forEach((l) => l());
  return data;
}

export async function persist() {
  await window.api.storeSet("library", cache);
  listeners.forEach((l) => l());
}

export async function addItems(items: Omit<LibraryItem, "id" | "currentPage" | "addedAt" | "bookmarks">[]) {
  const existing = new Set(cache.map((i) => i.filePath));
  const fresh = items
    .filter((i) => !existing.has(i.filePath))
    .map<LibraryItem>((i) => ({
      ...i,
      id: `${i.filePath}#${Date.now()}`,
      currentPage: 0,
      addedAt: Date.now(),
      bookmarks: [],
      isBookmarked: false,
    }));
  cache = [...fresh, ...cache];
  await persist();
}

export async function removeItem(id: string) {
  cache = cache.filter((i) => i.id !== id);
  await persist();
}

export async function updateItem(id: string, patch: Partial<LibraryItem>) {
  cache = cache.map((i) => (i.id === id ? { ...i, ...patch } : i));
  await persist();
}

export async function clearAll() {
  cache = [];
  await persist();
}

export function useLibrary() {
  const [, set] = useState(0);
  useEffect(() => {
    const fn = () => set((v) => v + 1);
    listeners.add(fn);
    if (!cache.length || !settingsCache) {
      if (!cache.length) load();
      if (!settingsCache) loadSettings();
    } else {
      fn();
    }
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return {
    items: cache,
    settings: settingsCache ?? DEFAULTS,
    refresh: useCallback(() => load(), []),
    addItems: useCallback(addItems, []),
    removeItem: useCallback(removeItem, []),
    updateItem: useCallback(updateItem, []),
    clearAll: useCallback(clearAll, []),
  };
}

/* ------------------------- Settings ------------------------- */

export type ReadingMode = "single" | "double" | "continuous" | "manga";
export type ZoomMode = "fit-width" | "fit-height" | "custom";
export type AIVoiceStyle =
  | "male"
  | "female"
  | "child"
  | "villain"
  | "robotic"
  | "narrator"
  | "anime";

export type SubtitleStyle = "cinematic" | "minimal" | "manga";

export interface CharacterVoicePreference {
  character: string;
  voice: AIVoiceStyle;
  speed: number;
  pitch: number;
}

export interface AIDialogueSettings {
  enabled: boolean;
  autoPlay: boolean;
  muted: boolean;
  volume: number;
  voicePack: "cinematic" | "anime" | "classic";
  subtitleStyle: SubtitleStyle;
  dimBackground: boolean;
  panelFocus: boolean;
  bubbleGlow: boolean;
  characters: CharacterVoicePreference[];
}

export interface VisualEngineSettings {
  layoutMode: "compact" | "netflix" | "poster" | "manga";
  motionMode: "performance" | "balanced" | "cinematic";
  readerBackground: "amoled" | "blurred" | "gradient" | "ambient";
  dynamicWallpaper: boolean;
  blurIntensity: number;
  tileGlow: boolean;
  ambientExtraction: boolean;
}

export interface Settings {
  settingsVersion?: number;
  readingMode: ReadingMode;
  zoomMode: ZoomMode;
  zoomPercent: number;
  aiDialogue: AIDialogueSettings;
  visual: VisualEngineSettings;
}

export const DEFAULT_VISUAL_SETTINGS: VisualEngineSettings = {
  layoutMode: "manga",
  motionMode: "balanced",
  readerBackground: "ambient",
  dynamicWallpaper: true,
  blurIntensity: 12,
  tileGlow: true,
  ambientExtraction: true,
};

export const DEFAULT_AI_DIALOGUE_SETTINGS: AIDialogueSettings = {
  enabled: false,
  autoPlay: false,
  muted: false,
  volume: 0.85,
  voicePack: "cinematic",
  subtitleStyle: "cinematic",
  dimBackground: true,
  panelFocus: true,
  bubbleGlow: true,
  characters: [
    { character: "Narrator", voice: "narrator", speed: 0.92, pitch: 0.95 },
    { character: "Hero", voice: "male", speed: 1, pitch: 1 },
    { character: "Heroine", voice: "female", speed: 1.02, pitch: 1.08 },
    { character: "Villain", voice: "villain", speed: 0.86, pitch: 0.72 },
  ],
};

const DEFAULTS: Settings = {
  settingsVersion: 2,
  readingMode: "single",
  zoomMode: "fit-width",
  zoomPercent: 100,
  aiDialogue: DEFAULT_AI_DIALOGUE_SETTINGS,
  visual: DEFAULT_VISUAL_SETTINGS,
};

export async function loadSettings(): Promise<Settings> {
  const s = (await window.api.storeGet<Settings>("settings")) ?? null;
  
  let migrated: Settings = {
    ...DEFAULTS,
    ...(s ?? {}),
    aiDialogue: {
      ...DEFAULT_AI_DIALOGUE_SETTINGS,
      ...(s?.aiDialogue ?? {}),
      characters:
        s?.aiDialogue?.characters?.length
          ? s.aiDialogue.characters
          : DEFAULT_AI_DIALOGUE_SETTINGS.characters,
    },
    visual: {
      ...DEFAULT_VISUAL_SETTINGS,
      ...(s?.visual ?? {}),
    },
  };

  // Safe Migration from legacy tile to visual
  if (s && 'tile' in s && migrated.settingsVersion !== 2) {
    const tile = (s as any).tile;
    migrated.visual = {
      ...migrated.visual,
      dynamicWallpaper: tile?.showComicBackground ?? migrated.visual.dynamicWallpaper,
      blurIntensity: tile?.blurIntensity ?? migrated.visual.blurIntensity,
      tileGlow: tile?.glowEnabled ?? migrated.visual.tileGlow,
      motionMode: tile?.hoverAnimation === false ? "performance" : "balanced",
    };
    delete (migrated as any).tile;
  }
  
  migrated.settingsVersion = 2;
  
  settingsCache = migrated;
  listeners.forEach(l => l());

  // Save the migrated schema safely
  if (s && 'tile' in s) {
    await saveSettings(migrated);
  }

  return migrated;
}

export async function saveSettings(s: Settings) {
  settingsCache = s;
  listeners.forEach(l => l());
  await window.api.storeSet("settings", s);
}
