/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/renderer/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background:  "hsl(var(--bg) / <alpha-value>)",
        foreground:  "hsl(var(--fg) / <alpha-value>)",
        border:      "hsl(var(--border) / <alpha-value>)",
        muted:       "hsl(var(--muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-fg) / <alpha-value>)",
        card:        "hsl(var(--card) / <alpha-value>)",
        sidebar:     "hsl(var(--sidebar) / <alpha-value>)",
        primary:     "hsl(var(--primary) / <alpha-value>)",
        accent:      "hsl(var(--accent) / <alpha-value>)",
        surface:     "hsl(var(--surface) / <alpha-value>)",
        glass:       "hsl(var(--glass) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "glow-sm": "0 0 12px rgba(220, 37, 37, 0.35)",
        "glow":    "0 0 24px rgba(220, 37, 37, 0.45)",
        "glow-lg": "0 0 48px rgba(220, 37, 37, 0.55)",
        "glow-xl": "0 0 80px rgba(220, 37, 37, 0.40)",
        "glass":   "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        "card":    "0 4px 24px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)",
        "card-hover": "0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(220,37,37,0.2)",
        "panel":   "0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      backdropBlur: {
        "3xl": "48px",
        "4xl": "64px",
      },
      animation: {
        "fade-in":      "fadeIn 0.2s ease-out",
        "fade-in-up":   "fadeInUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.25s ease-out",
        "glow-pulse":   "glowPulse 2.5s ease-in-out infinite",
        "scan-line":    "scanLine 3s linear infinite",
        "float":        "float 4s ease-in-out infinite",
        "shimmer":      "shimmer 2s linear infinite",
        "spin-slow":    "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn:      { from: { opacity: "0" }, to: { opacity: "1" } },
        fadeInUp:    { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideInRight:{ from: { opacity: "0", transform: "translateX(24px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        glowPulse:   { "0%, 100%": { boxShadow: "0 0 20px rgba(220,37,37,0.4)" }, "50%": { boxShadow: "0 0 40px rgba(220,37,37,0.7)" } },
        scanLine:    { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(400%)" } },
        float:       { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-6px)" } },
        shimmer:     { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      transitionTimingFunction: {
        "spring":    "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth":    "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
