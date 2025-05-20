const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
// const isDev = require('electron-is-dev');
const { setupDatabase } = require('../electron/database');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  const isDev = !app.isPackaged;
  // Create the browser window
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      fullscreen: true,
      preload: path.join(__dirname, '../electron/preload.js')
    }
  });

  // Load the index.html from React app (dev or production)
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  // Open DevTools if in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady()
  .then(() => {
    setupDatabase();
    createWindow();
  });

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
}); 