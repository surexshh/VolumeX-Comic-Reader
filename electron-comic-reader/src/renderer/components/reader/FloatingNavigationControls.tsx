import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  pageCount: number;
  isManga: boolean;
  bookmarks: number[];
  visible: boolean;
  onJump: (page: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onFirst: () => void;
  onLast: () => void;
}

export function FloatingNavigationControls({
  page,
  pageCount,
  isManga,
  bookmarks,
  visible,
  onJump,
  onNext,
  onPrev,
  onFirst,
  onLast,
}: Props) {
  const max = Math.max(0, pageCount - 1);
  const value = Math.min(page, max);
  const progress = max > 0 ? (value / max) * 100 : 0;

  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center px-8"
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 20,
        scale: visible ? 1 : 0.97,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="pointer-events-auto" style={{ width: "min(960px, calc(100vw - 64px))" }}>
        {/* Nav buttons row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(9, 20, 19, 0.65)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              padding: "8px 10px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Ambient glow */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                pointerEvents: "none",
                background: "radial-gradient(circle at 30% 20%, rgba(220,37,37,0.2), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.06), transparent 30%)",
              }}
            />

            <NavButton label="First page" onClick={onFirst} disabled={value <= 0}
              icon={<><ChevronLeft style={{ width: 14, height: 14 }} /><ChevronLeft style={{ width: 14, height: 14, marginLeft: -10 }} /></>}
            />
            <NavButton
              label={isManga ? "Next page" : "Previous page"}
              onClick={isManga ? onNext : onPrev}
              disabled={value <= 0 && !isManga}
              icon={<ChevronLeft style={{ width: 18, height: 18 }} />}
            />

            {/* Page counter */}
            <div
              style={{
                minWidth: 96,
                textAlign: "center",
                padding: "0 12px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 2,
                }}
              >
                Page
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                }}
              >
                {pageCount === 0 ? 0 : page + 1}
                <span style={{ margin: "0 4px", color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>/</span>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 500 }}>{pageCount}</span>
              </div>
            </div>

            <NavButton
              label={isManga ? "Previous page" : "Next page"}
              onClick={isManga ? onPrev : onNext}
              disabled={value >= max && !isManga}
              icon={<ChevronRight style={{ width: 18, height: 18 }} />}
            />
            <NavButton label="Last page" onClick={onLast} disabled={value >= max}
              icon={<><ChevronRight style={{ width: 14, height: 14 }} /><ChevronRight style={{ width: 14, height: 14, marginLeft: -10 }} /></>}
            />
          </div>
        </div>

        {/* Slider row */}
        <div
          style={{
            position: "relative",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(9, 20, 19, 0.65)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            padding: "10px 18px",
            boxShadow: "0 16px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              pointerEvents: "none",
              background: "rgba(255,255,255,0.015)",
            }}
          />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 36,
                textAlign: "right",
                fontSize: 11,
                fontVariantNumeric: "tabular-nums",
                fontWeight: 600,
                color: "hsl(var(--primary))",
              }}
            >
              {pageCount === 0 ? 0 : page + 1}
            </span>

            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="range"
                min={0}
                max={max}
                value={value}
                onChange={(event) => onJump(parseInt(event.target.value, 10))}
                className="reader-nav-range relative z-10 w-full cursor-pointer appearance-none bg-transparent"
                style={{
                  background: `linear-gradient(90deg,
                    hsl(var(--primary)) 0%,
                    hsl(var(--accent)) ${progress}%,
                    rgba(255,255,255,0.15) ${progress}%,
                    rgba(255,255,255,0.15) 100%)`,
                }}
              />
              {/* Progress glow blur */}
              <div
                style={{
                  pointerEvents: "none",
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: 6,
                  width: `${progress}%`,
                  borderRadius: 999,
                  background: "hsl(var(--primary))",
                  filter: "blur(6px)",
                  opacity: progress > 0 ? 0.6 : 0,
                }}
              />
              {/* Bookmark markers */}
              <div style={{ pointerEvents: "none", position: "absolute", inset: "0 0", top: "50%", transform: "translateY(-50%)", height: 16 }}>
                {bookmarks.map((bookmark) => (
                  <span
                    key={bookmark}
                    style={{
                      position: "absolute",
                      top: 0,
                      height: "100%",
                      width: 2,
                      borderRadius: 999,
                      background: "hsl(45 100% 70%)",
                      boxShadow: "0 0 8px rgba(253, 224, 71, 0.9)",
                      left: `calc(${(bookmark / Math.max(1, max)) * 100}% - 1px)`,
                    }}
                    title={`Bookmark page ${bookmark + 1}`}
                  />
                ))}
              </div>
            </div>

            <span
              style={{
                width: 36,
                fontSize: 11,
                fontVariantNumeric: "tabular-nums",
                fontWeight: 500,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {pageCount}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NavButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        position: "relative",
        width: 40,
        height: 40,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.06)",
        color: disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.85)",
        display: "grid",
        placeItems: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        overflow: "hidden",
        flexShrink: 0,
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
      whileHover={disabled ? undefined : { scale: 1.1, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      transition={{ type: "spring", stiffness: 460, damping: 26 }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--primary) / 0.5)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px hsl(var(--primary) / 0.3)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {/* Hover radial glow */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 999,
          background: "radial-gradient(circle, hsl(var(--primary) / 0.35), transparent 65%)",
          opacity: 0,
          transition: "opacity 0.2s ease",
        }}
        className="nav-btn-glow"
      />
      <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </span>
    </motion.button>
  );
}
