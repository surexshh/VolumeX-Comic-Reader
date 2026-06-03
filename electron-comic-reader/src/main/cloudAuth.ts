import { BrowserWindow, safeStorage } from "electron";
import Store from "electron-store";

// Use a separate store specifically for secure cloud tokens
const tokenStore = new Store({ name: "cloud-tokens" });

export interface CloudTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

/**
 * Saves and securely encrypts cloud tokens using OS-level safeStorage if available.
 */
export function saveTokens(provider: string, tokens: CloudTokens) {
  const json = JSON.stringify(tokens);
  let storedValue: string;

  if (safeStorage.isEncryptionAvailable()) {
    storedValue = safeStorage.encryptString(json).toString("base64");
  } else {
    // Fallback if safeStorage is unsupported on this OS configuration
    storedValue = Buffer.from(json).toString("base64");
  }

  tokenStore.set(provider, storedValue);
}

/**
 * Retrieves and decrypts cloud tokens. Returns null if missing or corrupted.
 */
export function getTokens(provider: string): CloudTokens | null {
  const encrypted = tokenStore.get(provider) as string | undefined;
  if (!encrypted) return null;

  try {
    let json: string;
    if (safeStorage.isEncryptionAvailable()) {
      json = safeStorage.decryptString(Buffer.from(encrypted, "base64"));
    } else {
      json = Buffer.from(encrypted, "base64").toString("utf8");
    }
    return JSON.parse(json);
  } catch (err) {
    console.error(`[cloudAuth] Failed to decrypt tokens for ${provider}`, err);
    return null;
  }
}

export function clearTokens(provider: string) {
  tokenStore.delete(provider);
}

export function getConnectedProviders(): string[] {
  return Object.keys(tokenStore.store);
}

/**
 * Authenticates a user using standard OAuth 2.0 authorization code flow.
 * Opens a modal window and listens for the redirect URI.
 */
export function authenticateOAuth(
  provider: string,
  authUrl: string,
  redirectUri: string,
  exchangeCodeForTokens: (code: string) => Promise<CloudTokens>
): Promise<CloudTokens> {
  return new Promise((resolve, reject) => {
    const parent = BrowserWindow.getFocusedWindow();
    const authWin = new BrowserWindow({
      parent: parent || undefined,
      modal: !!parent,
      width: 600,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      autoHideMenuBar: true,
      backgroundColor: "#091413",
    });

    // Clean up window on close
    authWin.on("closed", () => {
      reject(new Error("User closed the authentication window"));
    });

    const handleRedirect = async (url: string) => {
      if (url.startsWith(redirectUri)) {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get("code");
        const error = urlObj.searchParams.get("error");

        if (error) {
          authWin.destroy();
          reject(new Error(`OAuth Error: ${error}`));
          return;
        }

        if (code) {
          // We got the code! Exchange it for tokens now.
          try {
            authWin.hide(); // Hide quickly so user doesn't stare at empty screen
            const tokens = await exchangeCodeForTokens(code);
            saveTokens(provider, tokens);
            authWin.destroy();
            resolve(tokens);
          } catch (err) {
            authWin.destroy();
            reject(err);
          }
        }
      }
    };

    authWin.webContents.on("will-redirect", (_, url) => handleRedirect(url));
    authWin.webContents.on("did-redirect-navigation", (_, url) => handleRedirect(url));
    
    // Some OAuth providers redirect via standard navigation instead of HTTP 302
    authWin.webContents.on("did-navigate", (_, url) => handleRedirect(url));

    authWin.loadURL(authUrl);
  });
}
