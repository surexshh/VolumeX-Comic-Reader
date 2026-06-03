import { useEffect, useMemo, useRef, useState } from "react";
import logoImage from "@/assets/logo-volumex.jpg";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { Bot, RefreshCw, RotateCcw, Search, Sparkles, Trash2, Volume2, Github, AlertCircle, Cpu, Layers, Zap, Image as ImageIcon, Monitor, BookOpen } from "lucide-react";
import { FuturisticToggle } from "@/components/ui/FuturisticToggle";
import {
  DEFAULT_AI_DIALOGUE_SETTINGS,
  loadSettings,
  saveSettings,
  useLibrary,
  type AIDialogueSettings,
  type AIVoiceStyle,
  type CharacterVoicePreference,
  type Settings,
  type SubtitleStyle,
} from "@/store/library";

interface Props {
  current: "settings";
  onNavigate: (route: "library" | "recent" | "settings") => void;
}

const TABS = ["General", "Visual Engine", "Keyboard shortcuts", "About Volume"];

/* ═══════════════════════════════════════════════════════════════
   SETTINGS PAGE
═══════════════════════════════════════════════════════════════ */

export function SettingsPage({ current, onNavigate }: Props) {
  const [settings, setSettings] = useState<Settings>({
    readingMode: "single",
    zoomMode: "fit-height",
    zoomPercent: 100,
    aiDialogue: DEFAULT_AI_DIALOGUE_SETTINGS,
  });
  const [activeTab, setActiveTab] = useState(0);
  const { items, clearAll } = useLibrary();

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const updateAI = (patch: Partial<AIDialogueSettings>) => {
    update({ aiDialogue: { ...settings.aiDialogue, ...patch } });
  };

  return (
    <div className="h-screen" style={{ background: "transparent", position: "relative" }}>
      <Sidebar current={current} onNavigate={onNavigate} />
      <main className="cover-main overflow-y-auto" style={{ height: "100%", marginLeft: 72 }}>

        {/* ── Sticky header ── */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "hsl(167 47% 6% / 0.92)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div style={{ display: "flex", height: 60, alignItems: "center", paddingLeft: 28, paddingRight: 28 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.025em", color: "#ffffff", margin: 0 }}>
              Settings
            </h1>
          </div>

          {/* Tab bar — indicator width measured from actual label element */}
          <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </header>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <GeneralTab
                settings={settings}
                items={items}
                update={update}
                updateAI={updateAI}
                clearAll={clearAll}
              />
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div
              key="visual-engine"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <VisualEngineTab settings={settings} update={update} />
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div
              key="shortcuts"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <KeyboardShortcutsTab />
            </motion.div>
          )}

          {activeTab === 3 && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <AboutTab />
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GENERAL TAB  (unchanged logic, same UI)
═══════════════════════════════════════════════════════════════ */

function GeneralTab({
  settings,
  items,
  update,
  updateAI,
  clearAll,
}: {
  settings: Settings;
  items: ReturnType<typeof useLibrary>["items"];
  update: (p: Partial<Settings>) => void;
  updateAI: (p: Partial<AIDialogueSettings>) => void;
  clearAll: () => Promise<void>;
}) {
  return (
    <div style={{ maxWidth: 820, padding: "28px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

      <Section title="Default reading mode">
        <Row
          value={settings.readingMode}
          onChange={(v) => update({ readingMode: v })}
          options={[
            ["single", "Single page"],
            ["double", "Double page"],
            ["continuous", "Continuous scroll"],
            ["manga", "Manga (right-to-left)"],
          ]}
        />
      </Section>

      <Section title="Default zoom">
        <Row
          value={settings.zoomMode}
          onChange={(v) => update({ zoomMode: v })}
          options={[
            ["fit-width", "Fit width"],
            ["fit-height", "Fit height"],
            ["custom", "Custom"],
          ]}
        />
        {settings.zoomMode === "custom" && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="range"
              min={25}
              max={400}
              step={5}
              value={settings.zoomPercent}
              onChange={(e) => update({ zoomPercent: parseInt(e.target.value, 10) })}
              className="flex-1"
              style={{ accentColor: "hsl(var(--primary))" }}
            />
            <div style={{ width: 56, textAlign: "right", fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "hsl(var(--primary))" }}>
              {settings.zoomPercent}%
            </div>
          </div>
        )}
      </Section>

      {/* AI Dialogue Panel */}
      <section
        style={{
          position: "relative", overflow: "hidden",
          borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)",
          background: "hsl(var(--card))", padding: 24,
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at top left, hsl(var(--primary) / 0.12) 0%, transparent 50%)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", background: "hsl(var(--primary) / 0.14)", border: "1px solid hsl(var(--primary) / 0.3)", boxShadow: "0 0 20px hsl(var(--primary) / 0.2)" }}>
              <Sparkles style={{ width: 18, height: 18, color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>AI Dialogue Mode</div>
              <div style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>OCR, subtitles, glow focus, and AI-style voice playback.</div>
            </div>
          </div>
          <FuturisticToggle checked={settings.aiDialogue.enabled} onChange={(enabled) => updateAI({ enabled })} size="lg" />
        </div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <Label>Voice pack</Label>
            <Row value={settings.aiDialogue.voicePack} onChange={(v) => updateAI({ voicePack: v })} options={[["cinematic", "Cinematic"], ["anime", "Anime"], ["classic", "Classic"]]} />
          </div>
          <div>
            <Label>Subtitle style</Label>
            <Row<SubtitleStyle> value={settings.aiDialogue.subtitleStyle} onChange={(v) => updateAI({ subtitleStyle: v })} options={[["cinematic", "Cinematic"], ["minimal", "Minimal"], ["manga", "Manga"]]} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SettingRow label="Auto-play" description="Continue through detected dialogue automatically.">
              <FuturisticToggle checked={settings.aiDialogue.autoPlay} onChange={(autoPlay) => updateAI({ autoPlay })} size="sm" />
            </SettingRow>
            <SettingRow label="Bubble glow" description="Light up the active speech bubble.">
              <FuturisticToggle checked={settings.aiDialogue.bubbleGlow} onChange={(bubbleGlow) => updateAI({ bubbleGlow })} size="sm" />
            </SettingRow>
            <SettingRow label="Background dim" description="Add cinematic contrast behind subtitles.">
              <FuturisticToggle checked={settings.aiDialogue.dimBackground} onChange={(dimBackground) => updateAI({ dimBackground })} size="sm" />
            </SettingRow>
            <SettingRow label="Panel focus" description="Frame the current panel with a soft scan glow.">
              <FuturisticToggle checked={settings.aiDialogue.panelFocus} onChange={(panelFocus) => updateAI({ panelFocus })} size="sm" />
            </SettingRow>
          </div>
          <div>
            <Label>Voice volume</Label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "10px 14px" }}>
              <Volume2 style={{ width: 16, height: 16, color: "rgba(255,255,255,0.45)", flexShrink: 0 }} />
              <input type="range" min={0} max={1} step={0.05} value={settings.aiDialogue.volume} onChange={(e) => updateAI({ volume: parseFloat(e.target.value) })} className="flex-1" style={{ accentColor: "hsl(var(--primary))" }} />
              <span style={{ width: 40, textAlign: "right", fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "hsl(var(--primary))" }}>{Math.round(settings.aiDialogue.volume * 100)}%</span>
            </div>
          </div>
          <div>
            <Label>Character voices</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {settings.aiDialogue.characters.map((character) => (
                <CharacterVoiceRow key={character.character} value={character} onChange={(next) => updateAI({ characters: settings.aiDialogue.characters.map((c) => (c.character === next.character ? next : c)) })} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section title="Library">
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>
          {items.length} {items.length === 1 ? "item" : "items"} stored in your library.
        </div>
        <button
          disabled={!items.length}
          onClick={async () => { if (confirm("Remove ALL comics from your library?")) await clearAll(); }}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(220,50,50,0.3)", background: "rgba(220,50,50,0.08)", color: "#f87171", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.18s ease", opacity: !items.length ? 0.4 : 1 }}
          onMouseEnter={(e) => { if (items.length) (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,50,50,0.16)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,50,50,0.08)"; }}
        >
          <Trash2 style={{ width: 14, height: 14 }} />
          Clear library
        </button>
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VISUAL ENGINE TAB
═══════════════════════════════════════════════════════════════ */

function VisualEngineTab({ settings, update }: { settings: Settings; update: (p: Partial<Settings>) => void }) {
  const visual = settings?.visual ?? {
    layoutMode: "compact", motionMode: "balanced", readerBackground: "amoled",
    dynamicWallpaper: true, blurIntensity: 12, tileGlow: true, ambientExtraction: false
  };

  return (
    <div style={{ maxWidth: 1080, padding: "28px 28px", display: "flex", gap: 32, alignItems: "flex-start" }}>
      {/* LEFT: Controls */}
      <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column", gap: 24 }}>

        <Section title="Engine Settings">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Label>Layout Mode</Label>
              <Row value={visual.layoutMode} onChange={(v) => update({ visual: { ...visual, layoutMode: v } })} options={[["compact", "Compact"], ["netflix", "Netflix"], ["poster", "Poster Wall"], ["manga", "Manga Shelf"]]} />
            </div>
            <div>
              <Label>Motion & Physics</Label>
              <Row value={visual.motionMode} onChange={(v) => update({ visual: { ...visual, motionMode: v } })} options={[["performance", "Performance"], ["balanced", "Balanced"], ["cinematic", "Cinematic"]]} />
            </div>
            <div>
              <Label>Reader Background</Label>
              <Row value={visual.readerBackground} onChange={(v) => update({ visual: { ...visual, readerBackground: v } })} options={[["amoled", "AMOLED Black"], ["blurred", "Blurred Comic"], ["gradient", "Gradient"], ["ambient", "Ambient Glow"]]} />
            </div>
          </div>
        </Section>

        <Section title="Ambient & Effects">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SettingRow label="Dynamic Wallpapers" description="Slowly rotate comic covers as the app background.">
              <FuturisticToggle checked={visual.dynamicWallpaper} onChange={(v) => update({ visual: { ...visual, dynamicWallpaper: v } })} size="sm" />
            </SettingRow>
            
            <SettingRow label="Ambient Extraction" description="Extract ambient colors from covers to illuminate the UI.">
              <FuturisticToggle checked={visual.ambientExtraction} onChange={(v) => update({ visual: { ...visual, ambientExtraction: v } })} size="sm" />
            </SettingRow>

            <SettingRow label="Tile Glow" description="Enable the premium ambient glow behind tiles.">
              <FuturisticToggle checked={visual.tileGlow} onChange={(v) => update({ visual: { ...visual, tileGlow: v } })} size="sm" />
            </SettingRow>

            <SettingRow label="Glassmorphism Blur" description="Adjust the intensity of the UI glass blur.">
              <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "8px 12px", width: 200 }}>
                <input type="range" min={0} max={30} step={1} value={visual.blurIntensity} onChange={(e) => update({ visual: { ...visual, blurIntensity: parseInt(e.target.value, 10) } })} className="flex-1" style={{ accentColor: "hsl(var(--primary))" }} />
                <span style={{ width: 24, textAlign: "right", fontSize: 12, fontWeight: 600, color: "hsl(var(--primary))", fontVariantNumeric: "tabular-nums" }}>{visual.blurIntensity}</span>
              </div>
            </SettingRow>
          </div>
        </Section>
      </div>

      {/* RIGHT: Live Preview */}
      <div style={{ flex: "1 1 50%", position: "sticky", top: 100 }}>
        <Section title="Live Tile Preview">
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0", background: "radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)", borderRadius: 12 }}>
            
            <motion.div
              whileHover={visual.motionMode === "performance" ? {} : visual.motionMode === "cinematic" ? { y: -8, scale: 1.03 } : { y: -4, scale: 1.015 }}
              transition={visual.motionMode === "performance" ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
              style={{
                width: 220,
                aspectRatio: "2/3",
                borderRadius: visual.layoutMode === "poster" ? 0 : 16,
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                background: "hsl(var(--card))",
                border: visual.layoutMode === "poster" ? "none" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: visual.layoutMode === "poster" ? "none" : visual.tileGlow ? "0 24px 64px rgba(220, 37, 37, 0.15), 0 0 0 1px rgba(255,255,255,0.05)" : "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              {/* Background Art */}
              <div style={{ position: "absolute", inset: 0, opacity: 1 }}>
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(45deg, #1a1a2e, #16213e, #0f3460)", display: "grid", placeItems: "center" }}>
                  <ImageIcon style={{ width: 48, height: 48, color: "rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              
              {/* Blur Overlay */}
              {visual.blurIntensity > 0 && (
                <div style={{ position: "absolute", inset: 0, backdropFilter: `blur(${visual.blurIntensity}px)`, WebkitBackdropFilter: `blur(${visual.blurIntensity}px)`, background: "rgba(9, 20, 19, 0.4)" }} />
              )}
              
              {/* Overlay Gradient */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(9,20,19,0.95) 100%)" }} />
              
              {/* Content */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "hsl(var(--primary))", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>MANGA</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>VolumeX Preview Comic</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6, fontWeight: 500 }}>Page 12 / 100</div>
              </div>
              
              {/* Progress bar */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.1)" }}>
                <div style={{ height: "100%", width: "12%", background: "hsl(var(--primary))", boxShadow: "0 0 8px hsl(var(--primary) / 0.8)" }} />
              </div>
            </motion.div>

          </div>
        </Section>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABOUT TAB
═══════════════════════════════════════════════════════════════ */

function AboutTab() {
  return (
    <div style={{ maxWidth: 820, padding: "28px 28px 64px", display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Hero Header */}
      <section style={{ 
        position: "relative", overflow: "hidden", borderRadius: 24, 
        border: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--card))", 
        padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "center", 
        textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" 
      }}>
        {/* Glows */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", height: 200, background: "radial-gradient(circle at 50% -20%, hsl(var(--primary) / 0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        
        {/* Logo */}
        <div style={{ width: 80, height: 80, borderRadius: 16, overflow: "hidden", display: "grid", placeItems: "center", boxShadow: "0 12px 32px rgba(220, 37, 37, 0.2), inset 0 2px 0 rgba(255,255,255,0.05)", marginBottom: 20 }}>
          <img src={logoImage} alt="VolumeX Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", margin: "0 0 8px" }}>
          Volume<span style={{ color: "hsl(var(--primary))" }}>X</span>
        </h1>
        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Version 1.0.0-beta
        </div>
        
        <p style={{ marginTop: 24, fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 480 }}>
          The premium, high-performance desktop comic reader. Built with modern web technologies to deliver a cinematic reading experience.
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          <a href="#" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "hsl(var(--primary))", color: "#fff", fontSize: 14, fontWeight: 600, transition: "all 0.2s ease", boxShadow: "0 4px 16px hsl(var(--primary) / 0.3)" }}>
            <Github style={{ width: 16, height: 16 }} />
            GitHub Repository
          </a>
          <a href="#" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 600, transition: "all 0.2s ease" }}>
            <AlertCircle style={{ width: 16, height: 16 }} />
            Report Issue
          </a>
        </div>
      </section>

      {/* Tech Stack Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <AboutCard icon={<Monitor />} title="Electron Core" desc="High-performance native desktop bridge with IPC integration." color="#9feaf9" />
        <AboutCard icon={<Layers />} title="React UI" desc="Component-driven cinematic user interface." color="#61dafb" />
        <AboutCard icon={<Zap />} title="Vite Pipeline" desc="Lightning-fast HMR and optimized production builds." color="#646cff" />
        <AboutCard icon={<Sparkles />} title="Framer Motion" desc="Hardware-accelerated animations and page transitions." color="#ff008c" />
      </div>

      <Section title="Reader Engine">
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 16px" }}>VolumeX uses a custom-built PDF/CBZ rendering engine designed for maximum FPS and zero-latency page turns. The reader leverages HTML5 Canvas and offscreen web workers to decode heavy comic archives in the background without blocking the main thread.</p>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, color: "rgba(255,255,255,0.8)" }}>
            <li><b>Format Support:</b> CBZ, CBR, PDF, EPUB (Coming soon)</li>
            <li><b>Memory Management:</b> Aggressive texture garbage collection</li>
            <li><b>Hardware Acceleration:</b> GPU-backed transforms</li>
            <li><b>AI Integration:</b> Local OCR text detection & voice synthesis</li>
          </ul>
        </div>
      </Section>
      
      <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 24 }}>
        Built by the Open Source Community.
      </div>
    </div>
  );
}

function AboutCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div style={{ 
      padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.02)", 
      border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 12,
      transition: "background 0.2s ease" 
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `color-mix(in srgb, ${color} 15%, transparent)`, display: "grid", placeItems: "center", color: color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS TAB  — Phase 2
═══════════════════════════════════════════════════════════════ */

interface ShortcutDef {
  action: string;
  keys:   string[];   // each string = one keycap
  chord?: boolean;    // true = keys pressed together
}

interface ShortcutGroup {
  id:    string;
  label: string;
  icon:  string;
  items: ShortcutDef[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    id: "navigation",
    label: "Navigation",
    icon: "→",
    items: [
      { action: "Next page",          keys: ["→"],              chord: false },
      { action: "Previous page",      keys: ["←"],              chord: false },
      { action: "First page",         keys: ["Home"],           chord: false },
      { action: "Last page",          keys: ["End"],            chord: false },
      { action: "Next page (alt)",    keys: ["Space"],          chord: false },
      { action: "Previous page (alt)",keys: ["Shift", "Space"], chord: true  },
      { action: "Jump 10 pages forward", keys: ["Shift", "→"], chord: true  },
      { action: "Jump 10 pages back",    keys: ["Shift", "←"], chord: true  },
    ],
  },
  {
    id: "reader",
    label: "Reader Controls",
    icon: "⚙",
    items: [
      { action: "Toggle toolbar",         keys: ["T"],       chord: false },
      { action: "Toggle fullscreen",      keys: ["F"],       chord: false },
      { action: "Bookmark current page",  keys: ["B"],       chord: false },
      { action: "Toggle bookmarks panel", keys: ["P"],       chord: false },
      { action: "Toggle AI dialogue",     keys: ["A"],       chord: false },
      { action: "Back to library",        keys: ["Esc"],     chord: false },
      { action: "Toggle double page",     keys: ["D"],       chord: false },
      { action: "Toggle manga mode",      keys: ["M"],       chord: false },
    ],
  },
  {
    id: "zoom",
    label: "View Controls",
    icon: "⊕",
    items: [
      { action: "Zoom in",          keys: ["Ctrl", "+"],   chord: true  },
      { action: "Zoom out",         keys: ["Ctrl", "-"],   chord: true  },
      { action: "Fit to width",     keys: ["W"],           chord: false },
      { action: "Fit to height",    keys: ["H"],           chord: false },
      { action: "Reset zoom (100%)",keys: ["Ctrl", "0"],   chord: true  },
      { action: "Scroll up",        keys: ["↑"],           chord: false },
      { action: "Scroll down",      keys: ["↓"],           chord: false },
    ],
  },
  {
    id: "manga",
    label: "Manga Controls",
    icon: "漫",
    items: [
      { action: "Manga next page",      keys: ["←"],           chord: false },
      { action: "Manga previous page",  keys: ["→"],           chord: false },
      { action: "Toggle RTL mode",      keys: ["R"],           chord: false },
      { action: "Long strip mode",      keys: ["L"],           chord: false },
    ],
  },
  {
    id: "library",
    label: "Library Actions",
    icon: "◫",
    items: [
      { action: "Open file(s)",         keys: ["Ctrl", "O"],   chord: true  },
      { action: "Open folder",          keys: ["Ctrl", "Shift", "O"], chord: true },
      { action: "Go to library",        keys: ["G", "L"],      chord: false },
      { action: "Go to settings",       keys: ["G", "S"],      chord: false },
      { action: "Search library",       keys: ["Ctrl", "K"],   chord: true  },
      { action: "Refresh library",      keys: ["F5"],          chord: false },
    ],
  },
];

const ALL_SHORTCUTS = SHORTCUT_GROUPS.flatMap((g) =>
  g.items.map((s) => ({ ...s, groupId: g.id, groupLabel: g.label }))
);

function KeyboardShortcutsTab() {
  const [query, setQuery] = useState("");
  const [resetAnim, setResetAnim] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return null; // null = show groups
    return ALL_SHORTCUTS.filter(
      (s) =>
        s.action.toLowerCase().includes(q) ||
        s.keys.some((k) => k.toLowerCase().includes(q)) ||
        s.groupLabel.toLowerCase().includes(q)
    );
  }, [query]);

  const handleReset = () => {
    setQuery("");
    setResetAnim(true);
    inputRef.current?.focus();
    setTimeout(() => setResetAnim(false), 600);
  };

  return (
    <div style={{ padding: "24px 28px 48px", maxWidth: 1080 }}>

      {/* ── Search bar ── */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            10,
          marginBottom:   24,
          position:       "sticky",
          top:            104, // header height
          zIndex:         5,
          padding:        "10px 0",
          background:     "hsl(var(--bg))",
        }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            style={{
              position:  "absolute",
              left:      12,
              top:       "50%",
              transform: "translateY(-50%)",
              width:     15,
              height:    15,
              color:     "rgba(255,255,255,0.3)",
              pointerEvents: "none",
            }}
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shortcuts… (action or key name)"
            style={{
              width:        "100%",
              height:       42,
              paddingLeft:  38,
              paddingRight: 16,
              borderRadius: 12,
              border:       query
                ? "1px solid hsl(var(--primary) / 0.45)"
                : "1px solid rgba(255,255,255,0.09)",
              background:   query
                ? "hsl(var(--primary) / 0.06)"
                : "rgba(255,255,255,0.05)",
              color:        "#ffffff",
              fontSize:     14,
              outline:      "none",
              transition:   "all 0.2s ease",
              boxShadow:    query
                ? "0 0 0 3px hsl(var(--primary) / 0.12)"
                : "none",
            }}
            onFocus={(e) => {
              e.target.style.border = "1px solid hsl(var(--primary) / 0.45)";
              e.target.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.12)";
            }}
            onBlur={(e) => {
              if (!query) {
                e.target.style.border = "1px solid rgba(255,255,255,0.09)";
                e.target.style.boxShadow = "none";
              }
            }}
          />
        </div>

        {/* Animated reset */}
        <motion.button
          type="button"
          onClick={handleReset}
          title="Clear search"
          animate={resetAnim ? { rotate: [0, -180, -360] } : { rotate: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            width:        38,
            height:       38,
            borderRadius: 10,
            border:       "1px solid rgba(255,255,255,0.08)",
            background:   "rgba(255,255,255,0.05)",
            color:        "rgba(255,255,255,0.45)",
            display:      "grid",
            placeItems:   "center",
            cursor:       "pointer",
            flexShrink:   0,
            transition:   "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
          }}
        >
          <RotateCcw style={{ width: 15, height: 15 }} />
        </motion.button>

        {/* Hit count */}
        {filtered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize:       12,
              fontWeight:     600,
              color:          filtered.length > 0 ? "hsl(var(--primary))" : "rgba(255,255,255,0.3)",
              whiteSpace:     "nowrap",
              letterSpacing:  "-0.01em",
            }}
          >
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </motion.div>
        )}
      </div>

      {/* ── Search results mode ── */}
      <AnimatePresence mode="wait">
        {filtered ? (
          <motion.div
            key="search-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  display:        "flex",
                  flexDirection:  "column",
                  alignItems:     "center",
                  justifyContent: "center",
                  gap:            12,
                  padding:        "64px 0",
                  color:          "rgba(255,255,255,0.3)",
                }}
              >
                <Search style={{ width: 36, height: 36, opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: 14 }}>No shortcuts match "{query}"</p>
              </div>
            ) : (
              <div
                style={{
                  display:               "grid",
                  gridTemplateColumns:   "repeat(auto-fill, minmax(340px, 1fr))",
                  gap:                   10,
                }}
              >
                {filtered.map((s, i) => (
                  <motion.div
                    key={`${s.groupId}-${s.action}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.02 }}
                  >
                    <ShortcutCard shortcut={s} groupLabel={s.groupLabel} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Grouped mode ── */
          <motion.div
            key="grouped"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: "flex", flexDirection: "column", gap: 28 }}
          >
            {SHORTCUT_GROUPS.map((group, gi) => (
              <motion.section
                key={group.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: gi * 0.04 }}
              >
                {/* Group header */}
                <div
                  style={{
                    display:       "flex",
                    alignItems:    "center",
                    gap:           10,
                    marginBottom:  12,
                    paddingBottom: 10,
                    borderBottom:  "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span
                    style={{
                      width:        30,
                      height:       30,
                      borderRadius: 8,
                      background:   "hsl(var(--primary) / 0.14)",
                      border:       "1px solid hsl(var(--primary) / 0.28)",
                      display:      "grid",
                      placeItems:   "center",
                      fontSize:     13,
                      flexShrink:   0,
                      color:        "hsl(var(--primary))",
                    }}
                  >
                    {group.icon}
                  </span>
                  <h3
                    style={{
                      margin:        0,
                      fontSize:      15,
                      fontWeight:    700,
                      color:         "#ffffff",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {group.label}
                  </h3>
                  <span
                    style={{
                      fontSize:     11,
                      fontWeight:   600,
                      color:        "rgba(255,255,255,0.3)",
                      padding:      "1px 7px",
                      borderRadius: 999,
                      background:   "rgba(255,255,255,0.06)",
                      border:       "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {group.items.length}
                  </span>
                </div>

                {/* 2-column card grid */}
                <div
                  style={{
                    display:             "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                    gap:                 10,
                  }}
                >
                  {group.items.map((s, si) => (
                    <motion.div
                      key={s.action}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: gi * 0.04 + si * 0.025 }}
                    >
                      <ShortcutCard shortcut={s} />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHORTCUT CARD
═══════════════════════════════════════════════════════════════ */

function ShortcutCard({
  shortcut,
  groupLabel,
}: {
  shortcut: ShortcutDef;
  groupLabel?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            12,
        padding:        "12px 14px",
        borderRadius:   12,
        border:         hovered
          ? "1px solid hsl(var(--primary) / 0.25)"
          : "1px solid rgba(255,255,255,0.07)",
        background:     hovered
          ? "hsl(var(--primary) / 0.06)"
          : "rgba(255,255,255,0.03)",
        transition:     "all 0.18s ease",
        boxShadow:      hovered
          ? "0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px hsl(var(--primary) / 0.08)"
          : "none",
      }}
    >
      {/* Action + optional group badge */}
      <div style={{ minWidth: 0 }}>
        {groupLabel && (
          <div
            style={{
              fontSize:     10,
              fontWeight:   700,
              letterSpacing:"0.1em",
              textTransform:"uppercase",
              color:        "hsl(var(--primary))",
              marginBottom: 3,
              opacity:      0.8,
            }}
          >
            {groupLabel}
          </div>
        )}
        <div
          style={{
            fontSize:     13,
            fontWeight:   500,
            color:        hovered ? "#ffffff" : "rgba(255,255,255,0.78)",
            lineHeight:   1.3,
            transition:   "color 0.15s ease",
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
          }}
        >
          {shortcut.action}
        </div>
      </div>

      {/* Keycaps */}
      <div style={{ display: "flex", alignItems: "center", gap: shortcut.chord ? 4 : 6, flexShrink: 0 }}>
        {shortcut.keys.map((key, ki) => (
          <span key={ki} style={{ display: "flex", alignItems: "center", gap: shortcut.chord ? 2 : 6 }}>
            <Keycap key={key} label={key} hovered={hovered} />
            {ki < shortcut.keys.length - 1 && (
              <span
                style={{
                  fontSize:   11,
                  color:      "rgba(255,255,255,0.3)",
                  fontWeight: 500,
                  userSelect: "none",
                  margin:     shortcut.chord ? "0 -1px" : "0 -2px",
                }}
              >
                {shortcut.chord ? "+" : "→"}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KEYCAP
═══════════════════════════════════════════════════════════════ */

function Keycap({ label, hovered }: { label: string; hovered: boolean }) {
  const isWide = label.length > 2;

  return (
    <kbd
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        justifyContent: "center",
        minWidth:       isWide ? "auto" : 28,
        height:         26,
        padding:        isWide ? "0 8px" : "0 6px",
        borderRadius:   7,
        /* Keycap 3D effect */
        background:     hovered
          ? "hsl(167 30% 14%)"
          : "hsl(167 28% 10%)",
        border:         hovered
          ? "1px solid hsl(var(--primary) / 0.4)"
          : "1px solid rgba(255,255,255,0.14)",
        boxShadow:      hovered
          ? `0 0 10px hsl(var(--primary) / 0.2),
             0 2px 0 hsl(167 30% 7%),
             inset 0 1px 0 rgba(255,255,255,0.12)`
          : `0 2px 0 hsl(167 28% 5%),
             inset 0 1px 0 rgba(255,255,255,0.08)`,
        fontSize:       label.length > 3 ? 10 : 11,
        fontWeight:     700,
        fontFamily:     "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        letterSpacing:  "0.02em",
        color:          hovered
          ? "hsl(var(--primary))"
          : "rgba(255,255,255,0.75)",
        userSelect:     "none",
        transition:     "all 0.18s ease",
        whiteSpace:     "nowrap",
        textTransform:  label.length <= 2 ? "uppercase" : "none",
      }}
    >
      {label}
    </kbd>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════════════ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        borderRadius: 18,
        border:       "1px solid rgba(255,255,255,0.07)",
        background:   "hsl(var(--card))",
        padding:      24,
        boxShadow:    "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "#ffffff", margin: "0 0 16px" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
      {children}
    </div>
  );
}

function Row<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            padding:    "7px 14px",
            borderRadius: 10,
            border:     value === v ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid rgba(255,255,255,0.08)",
            background: value === v ? "hsl(var(--primary) / 0.15)" : "rgba(255,255,255,0.04)",
            color:      value === v ? "#ffffff" : "rgba(255,255,255,0.5)",
            fontSize:   13,
            fontWeight: value === v ? 600 : 400,
            cursor:     "pointer",
            transition: "all 0.18s ease",
            boxShadow:  value === v ? "0 0 12px hsl(var(--primary) / 0.2)" : "none",
          }}
          onMouseEnter={(e) => { if (value !== v) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)"; } }}
          onMouseLeave={(e) => { if (value !== v) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; } }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ToggleLine({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", minHeight: 80, alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 14, border: checked ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid rgba(255,255,255,0.06)", background: checked ? "hsl(var(--primary) / 0.07)" : "rgba(255,255,255,0.03)", padding: "12px 14px", transition: "all 0.25s ease", boxShadow: checked ? "0 0 20px hsl(var(--primary) / 0.1)" : "none" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>{label}</div>
        <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.5, color: "rgba(255,255,255,0.4)", maxWidth: 200 }}>{description}</div>
      </div>
      <FuturisticToggle checked={checked} onChange={onChange} size="md" />
    </div>
  );
}

function CharacterVoiceRow({ value, onChange }: { value: CharacterVoicePreference; onChange: (v: CharacterVoicePreference) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 1fr 1fr", alignItems: "center", gap: 8, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: "8px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
        <Bot style={{ width: 14, height: 14, color: "hsl(var(--primary))", flexShrink: 0 }} />
        {value.character}
      </div>
      <select value={value.voice} onChange={(e) => onChange({ ...value, voice: e.target.value as AIVoiceStyle })} style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)", padding: "5px 8px", fontSize: 12, outline: "none", cursor: "pointer" }}>
        {(["male", "female", "child", "villain", "robotic", "narrator", "anime"] as AIVoiceStyle[]).map((voice) => (
          <option key={voice} value={voice} style={{ background: "hsl(167 28% 8%)" }}>{voice}</option>
        ))}
      </select>
      <MiniSlider label="Speed" value={value.speed} min={0.6} max={1.4} onChange={(speed) => onChange({ ...value, speed })} />
      <MiniSlider label="Pitch" value={value.pitch} min={0.5} max={1.6} onChange={(pitch) => onChange({ ...value, pitch })} />
    </div>
  );
}

function MiniSlider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
      <span style={{ width: 36, flexShrink: 0 }}>{label}</span>
      <input type="range" min={min} max={max} step={0.02} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ minWidth: 0, flex: 1, accentColor: "hsl(var(--primary))" }} />
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FIX 2 — TAB BAR
   Indicator width = exact measured text width via useRef array.
   Framer Motion layoutId slides it between tabs without layout shift.
═══════════════════════════════════════════════════════════════ */

function TabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs:        string[];
  activeTab:   number;
  onTabChange: (i: number) => void;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const activeLabel = labelRefs.current[activeTab];
    const container = containerRef.current;
    if (activeLabel && container) {
      const containerRect = container.getBoundingClientRect();
      const labelRect = activeLabel.getBoundingClientRect();
      
      setIndicatorStyle({
        left: labelRect.left - containerRect.left,
        width: labelRect.width,
        opacity: 1,
      });
    }
  }, [activeTab, tabs]);

  return (
    <nav
      ref={containerRef}
      style={{
        position:        "relative",
        display:         "flex",
        alignItems:      "center",
        paddingLeft:     28,
        paddingRight:    28,
        height:          44,
        gap:             0,
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === index;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(index)}
            style={{
              position:      "relative",
              padding:       "0 14px",
              height:        "100%",
              border:        "none",
              background:    "transparent",
              fontSize:      13,
              fontWeight:    isActive ? 600 : 400,
              color:         isActive ? "#ffffff" : "rgba(255,255,255,0.40)",
              cursor:        "pointer",
              letterSpacing: isActive ? "-0.01em" : "0",
              transition:    "color 0.16s ease, font-weight 0s",
              flexShrink:    0,
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.72)";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.40)";
            }}
          >
            <span
              ref={(el) => { labelRefs.current[index] = el; }}
              style={{ pointerEvents: "none", position: "relative" }}
            >
              {tab}
            </span>
          </button>
        );
      })}

      {/* Single absolute indicator */}
      <motion.div
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          opacity: indicatorStyle.opacity,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
          mass: 0.8,
        }}
        style={{
          position: "absolute",
          bottom: 0,
          height: 2,
          borderRadius: "2px 2px 0 0",
          background: "hsl(var(--primary))",
          boxShadow: "0 0 8px hsl(var(--primary) / 0.8), 0 0 16px hsl(var(--primary) / 0.4)",
          pointerEvents: "none",
        }}
      />
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FIX 3 — SETTING ROW
   Consistent layout: label left · description below · control right.
   Used inside Section cards for all toggle/select rows.
═══════════════════════════════════════════════════════════════ */

export function SettingRow({
  label,
  description,
  children,
}: {
  label:        string;
  description?: string;
  children:     React.ReactNode;
}) {
  return (
    <div
      style={{
        display:        "grid",
        gridTemplateColumns: "1fr auto",
        alignItems:     "center",
        gap:            "8px 16px",
        padding:        "12px 16px",
        borderRadius:   12,
        background:     "rgba(255,255,255,0.025)",
        border:         "1px solid rgba(255,255,255,0.055)",
        transition:     "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.025)";
      }}
    >
      {/* Label */}
      <div>
        <div
          style={{
            fontSize:      14,
            fontWeight:    500,
            color:         "rgba(255,255,255,0.90)",
            letterSpacing: "-0.01em",
            lineHeight:    1.3,
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              marginTop:  3,
              fontSize:   12,
              color:      "rgba(255,255,255,0.38)",
              lineHeight: 1.45,
            }}
          >
            {description}
          </div>
        )}
      </div>

      {/* Control — right-aligned */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        {children}
      </div>
    </div>
  );
}

