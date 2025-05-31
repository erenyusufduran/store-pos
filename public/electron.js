const { app, BrowserWindow } = require("electron");
const path = require("path");

const { setupDatabase, cleanup } = require(path.join(
  __dirname,
  "../electron/database"
));


// Keep a global reference of the window object
let mainWindow;

// Handle any uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// Handle any unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});

function createWindow() {
  const isDev = !app.isPackaged;
  // Create the browser window
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      fullscreen: true,
      preload: path.join(__dirname, "../electron/preload.js"),
    },
  });

  // Load the index.html from React app (dev or production)
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  // Open DevTools if in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Handle window errors
  mainWindow.webContents.on("crashed", (event) => {
    console.error("Window crashed:", event);
    // Optionally reload the window
    mainWindow.reload();
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("Failed to load:", errorCode, errorDescription);
    }
  );
}

// Initialize app
app
  .whenReady()
  .then(async () => {
    try {
      await setupDatabase();

      createWindow();
    } catch (error) {
      console.error("Failed to initialize app:", error);
      app.quit();
    }
  })
  .catch((error) => {
    console.error("Error during app initialization:", error);
    app.quit();
  });

// Quit when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle app quit
app.on("before-quit", () => {
  // Clean up any resources here
  if (mainWindow) {
    mainWindow.removeAllListeners();
  }
  // Clean up database
  cleanup();
});
