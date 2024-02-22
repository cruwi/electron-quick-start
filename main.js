const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  desktopCapturer,
  screen,
} = require("electron");

const nativeImage = require("electron").nativeImage;

const path = require("path");
const fs = require("fs");
const os = require("os");
const sharp = require("sharp");

let mainWindow;
let selectionWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile("index.html");
}

function createSelectionWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  selectionWindow = new BrowserWindow({
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  selectionWindow.loadFile("selection.html");
}

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register("CommandOrControl+Alt+S", () => {
    if (!selectionWindow) {
      createSelectionWindow();
    } else {
      selectionWindow.focus();
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

ipcMain.on("selected-area", async (event, bounds) => {
  // Hide the selection window to ensure it's not included in the screenshot
  if (selectionWindow) {
    selectionWindow.hide(); // Ensure the window is hidden before capturing
  }

  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: screen.getPrimaryDisplay().size, // Capture at full resolution
  });

  // Re-show the selection window here if you plan to use it again
  // Otherwise, it's being closed anyway

  const primaryScreen = sources[0];

  const imageBuffer = primaryScreen.thumbnail.toPNG();
  const imagePath = path.join(os.tmpdir(), "screenshot.png");

  sharp(imageBuffer)
    .metadata()
    .then((metadata) => {
      const scaleX =
        metadata.width / screen.getPrimaryDisplay().workAreaSize.width;
      const scaleY =
        metadata.height / screen.getPrimaryDisplay().workAreaSize.height;

      const extractBounds = {
        left: Math.round(bounds.x * scaleX),
        top: Math.round(bounds.y * scaleY),
        width: Math.round(bounds.width * scaleX),
        height: Math.round(bounds.height * scaleY),
      };

      if (
        extractBounds.left + extractBounds.width > metadata.width ||
        extractBounds.top + extractBounds.height > metadata.height
      ) {
        throw new Error(
          "Extract area exceeds the bounds of the captured image."
        );
      }

      return sharp(imageBuffer).extract(extractBounds).toFile(imagePath);
    })
    .then(() => {
      mainWindow.webContents.send("display-captured-image", imagePath);
      // Close the selection window after capturing
      if (selectionWindow) {
        selectionWindow.close();
        selectionWindow = null;
      }
    })
    .catch((err) => console.error("Error cropping the image:", err));
});
