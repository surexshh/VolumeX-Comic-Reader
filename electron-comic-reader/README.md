# VolumeX 📖⚡

<div align="center">
  <img src="src/renderer/assets/logo-volumex.jpg" alt="VolumeX Logo" width="200"/>
  <br/>
  <p><b>A premium, high-performance cinematic desktop comic reader.</b></p>
</div>

---

VolumeX is a modern, cross-platform desktop application built for comic enthusiasts who demand both aesthetics and performance. Built on Electron and React, it leverages hardware acceleration and a custom visual engine to deliver an immersive, stutter-free reading experience.

## ✨ Features

- ⚡ **High-Performance Reader Engine**: Hardware-accelerated decoding using HTML5 Canvas and off-screen Web Workers. Zero-latency page turns, even on heavy CBZ/CBR/PDF files.
- 🎨 **Global Visual Engine**: Deeply customizable UI with real-time reactive layout modes (Compact, Netflix Shelf, Poster Wall, Manga Shelf).
- 🌌 **Cinematic Ambient Glow**: Custom background engine that asynchronously extracts color palettes from comic covers using off-thread `requestIdleCallback` to project a beautiful ambient glow behind the app without dropping frames.
- 🔋 **Performance & Motion Modes**: Instantly scale back heavy Framer Motion physics and background blur overlays with "Performance Mode" to ensure stable 60FPS on low-end hardware.
- 🌙 **AMOLED Reading Mode**: Read in pitch-black environments with pure `#000000` backgrounds to save battery on OLED displays.
- 🤖 **AI Dialogue Integration**: Local OCR text detection and text-to-speech character voice synthesis for an immersive audio experience (In Development).

## 🚀 Tech Stack

- **Core**: Electron (Desktop Bridge)
- **UI Framework**: React 18, TypeScript, Vite
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Styling**: Tailwind CSS & Custom CSS Modules
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/volumex.git
   cd volumex
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 📣 Feedback & Feature Requests

Your feedback helps shape the future of VolumeX! Whether you found a bug, want to request a cinematic feature, or just love the reader engine, let me know.

<div align="center">
  <a href="https://forms.gle/MWhgZqVpQJYx9Fyy8" target="_blank">
    <img src="https://img.shields.io/badge/Submit_Feedback_&_Bugs-🚀-EA4335?style=for-the-badge&logo=googleforms&logoColor=white" alt="Submit Feedback Button" height="45"/>
  </a>
</div>

---
## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/volumex/issues).

## 📝 License

This project is licensed under the MIT License.
