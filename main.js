import { app, BrowserWindow } from "electron";
import serve from "electron-serve";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

// Serve the 'dist' directory out of production
const loadURL = serve({ directory: "dist" });

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (isDev) {
    // In dev mode, we connect back to the running Astro server via concurrently
    mainWindow.loadURL("http://localhost:4321/");
  } else {
    // In prod, serve the static bundle using electron-serve to avoid file:// CORS issues
    loadURL(mainWindow);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = new BrowserWindow({
        width: 1600,
        height: 1200,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });
      if (isDev) {
        mainWindow.loadURL("http://localhost:4321/");
      } else {
        loadURL(mainWindow);
      }
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
