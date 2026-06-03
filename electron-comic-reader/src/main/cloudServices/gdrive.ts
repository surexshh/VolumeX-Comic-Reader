import { app } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import { authenticateOAuth, getTokens, saveTokens, clearTokens } from "../cloudAuth";

// --- PLACEHOLDER OAUTH CREDENTIALS ---
// The user will replace these with real credentials from Google Cloud Console.
const CLIENT_ID = "add credentails";
const CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET";
const REDIRECT_URI = "com.example.volume-reader:/oauth2redirect";

// Google OAuth Endpoints
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

export interface CloudFile {
  id: string;
  name: string;
  isFolder: boolean;
  mimeType: string;
  size?: number;
  thumbnailLink?: string;
}

export async function login() {
  const scope = "https://www.googleapis.com/auth/drive.readonly";
  const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  return authenticateOAuth("gdrive", authUrl, REDIRECT_URI, async (code) => {
    // Exchange code for token
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to exchange code: ${await res.text()}`);
    }

    const data = await res.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
    };
  });
}

export async function logout() {
  clearTokens("gdrive");
}

async function getValidAccessToken(): Promise<string> {
  const tokens = getTokens("gdrive");
  if (!tokens) throw new Error("Not authenticated to Google Drive");

  // Check if token is expired (or expires in the next 1 minute)
  if (tokens.expires_at && Date.now() > tokens.expires_at - 60000) {
    if (!tokens.refresh_token) {
      clearTokens("gdrive");
      throw new Error("Token expired and no refresh token available");
    }

    // Refresh the token
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      clearTokens("gdrive");
      throw new Error("Failed to refresh token");
    }

    const data = await res.json();
    const newTokens = {
      access_token: data.access_token,
      refresh_token: tokens.refresh_token, // keep old refresh token
      expires_at: Date.now() + (data.expires_in * 1000),
    };
    saveTokens("gdrive", newTokens);
    return newTokens.access_token;
  }

  return tokens.access_token;
}

/**
 * List files and folders in a specific Google Drive directory.
 */
export async function listFiles(folderId: string = "root"): Promise<CloudFile[]> {
  const token = await getValidAccessToken();
  const query = `'${folderId}' in parents and trashed = false`;
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,thumbnailLink)&pageSize=1000`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Drive API error: ${await res.text()}`);

  const data = await res.json();
  const files: any[] = data.files || [];

  return files.map((f) => ({
    id: f.id,
    name: f.name,
    isFolder: f.mimeType === "application/vnd.google-apps.folder",
    mimeType: f.mimeType,
    size: f.size ? parseInt(f.size, 10) : undefined,
    thumbnailLink: f.thumbnailLink,
  }));
}

/**
 * Downloads a file from Google Drive to the local cloud cache asynchronously.
 * Yields the final local file path.
 */
export async function downloadFile(fileId: string, fileName: string, onProgress?: (percent: number) => void): Promise<string> {
  const token = await getValidAccessToken();
  const cacheDir = path.join(app.getPath("userData"), "cloud_cache");
  
  await fs.mkdir(cacheDir, { recursive: true });
  const destPath = path.join(cacheDir, `${fileId}_${fileName}`);

  // If already downloaded, just return it (basic caching)
  if (fsSync.existsSync(destPath)) {
    onProgress?.(100);
    return destPath;
  }

  const url = `${DRIVE_API}/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Failed to download file: ${await res.text()}`);
  if (!res.body) throw new Error("No response body");

  const totalSize = parseInt(res.headers.get("content-length") || "0", 10);
  let downloadedSize = 0;

  const fileStream = fsSync.createWriteStream(destPath);
  
  // Using Web Streams to Node.js streams translation for Node 20+
  // We'll read the response stream chunk by chunk
  const reader = res.body.getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      fileStream.write(value);
      downloadedSize += value.length;
      
      if (totalSize > 0 && onProgress) {
        onProgress(Math.round((downloadedSize / totalSize) * 100));
      }
    }
  } finally {
    fileStream.end();
  }

  return destPath;
}
