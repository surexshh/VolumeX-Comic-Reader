# Volume Comic Reader (Desktop)

Modern Windows/macOS/Linux comic reader built with Electron + React + TypeScript.

## Features

- **Formats**: CBZ, CBR (RAR), ZIP, PDF, single images, folders of images
- **Library**: Add a folder, scan recursively, persist to disk
- **Reader**: Single, double, continuous-scroll, manga (right-to-left)
- **Zoom**: Fit width / fit height / custom percentage
- **Drag & drop** files or folders directly onto the window
- **Keyboard**: Arrow keys (next/prev), `+` / `-` (zoom), `F` (fullscreen)
- **State**: Last read page, bookmarks, recently opened

## Project structure

```
electron-comic-reader/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.ts          # App lifecycle / window
│   │   ├── ipcHandlers.ts    # IPC routes
│   │   └── fileHandlers/     # Format-specific extractors
│   │       ├── cbz.ts
│   │       ├── cbr.ts
│   │       ├── pdf.ts
│   │       ├── image.ts
│   │       └── folder.ts
│   ├── preload/
│   │   └── index.ts          # Secure context bridge
│   └── renderer/             # React UI
│       ├── components/
│       ├── pages/
│       ├── store/
│       └── lib/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.main.json
└── package.json
```

## Setup

```bash
cd electron-comic-reader
npm install
```

> **Upgrading from an earlier copy?** Delete `node_modules` and
> `package-lock.json` first, then run `npm install`. A previous version of
> this scaffold pinned ESM-only versions of `electron-store` and `pdfjs-dist`
> that the CommonJS main process couldn't `require()`, which made `npm run dev`
> exit silently with code 1 right after `tsc` finished.

## Run in development

```bash
npm run dev
```

Vite serves the renderer on `http://localhost:5173`, then Electron launches once
the renderer is ready. The Electron window should appear within a few seconds —
if it doesn't, watch the `[ELECTRON]` log lines for an `uncaughtException`
message (the main process now prints any startup crash to the console).

## Build for Windows

```bash
npm run package:win
```

Installer is written to `release/Volume Comic Reader-Setup-1.0.0.exe` and a
portable build alongside it.

## Testing checklist

1. **Add folder**: Sidebar → "Add folder" → pick a folder containing CBZ/CBR/PDF
   files. Items appear in the grid with thumbnails.
2. **Open comic**: Click any tile → reader opens at the last read page.
3. **Open image folder**: Toolbar → "Open" → choose a folder of `.jpg` files.
4. **Reading modes**: Try Single / Double / Scroll / Manga via the toolbar.
5. **Zoom**: `+` and `-`, or use Fit width / Fit height buttons.
6. **Bookmarks**: Bookmark a page, return to library, reopen — page persists.

## Notes

- **CBR/RAR** uses `node-unrar-js` (pure-JS WASM). No native dependencies.
- **PDF** uses `pdfjs-dist` and rasterizes to images on demand.
- **Persistence** uses `electron-store` (`%APPDATA%\volume-comic-reader\`).
- **Image cache** holds at most 16 decoded pages in memory; older pages are evicted.
