/**
 * Asynchronous, non-blocking color extraction utility for the Visual Engine.
 * Extracts the dominant ambient color from an image using a hidden canvas.
 * Results are cached in memory to avoid redundant processing.
 */

const colorCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();

export async function extractDominantColor(src: string): Promise<string> {
  // 1. Check cache
  if (colorCache.has(src)) {
    return colorCache.get(src)!;
  }

  // 2. Prevent duplicate concurrent requests
  if (pendingRequests.has(src)) {
    return pendingRequests.get(src)!;
  }

  // 3. Process asynchronously
  const promise = new Promise<string>((resolve, reject) => {
    const processImage = () => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("No 2d context");

          // Downscale aggressively for performance (we just want an ambient color)
          canvas.width = 64;
          canvas.height = 64;
          ctx.drawImage(img, 0, 0, 64, 64);

          const imageData = ctx.getImageData(0, 0, 64, 64);
          const data = imageData.data;

          let r = 0, g = 0, b = 0;
          let count = 0;

          // Sample pixels (skip alpha)
          for (let i = 0; i < data.length; i += 16) {
            // Ignore near-black or near-white pixels to get better ambient colors
            const pixelBrightness = (data[i] * 299 + data[i+1] * 587 + data[i+2] * 114) / 1000;
            if (pixelBrightness > 20 && pixelBrightness < 235) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              count++;
            }
          }

          if (count === 0) {
            // Fallback to average of everything if image is very dark/light
            for (let i = 0; i < data.length; i += 4) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              count++;
            }
          }

          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          // Convert to Hex
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          
          colorCache.set(src, hex);
          pendingRequests.delete(src);
          resolve(hex);
        } catch (e) {
          pendingRequests.delete(src);
          reject(e);
        }
      };

      img.onerror = () => {
        pendingRequests.delete(src);
        reject(new Error("Image load failed"));
      };

      img.src = src;
    };

    // Use requestIdleCallback if available to avoid blocking main thread renders
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => processImage(), { timeout: 1000 });
    } else {
      setTimeout(processImage, 0);
    }
  });

  pendingRequests.set(src, promise);
  return promise;
}
