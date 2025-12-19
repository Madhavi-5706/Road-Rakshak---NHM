
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Check if we are in development mode (running via vite) or production (packaged app)
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "RoadGuard India",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Remove menu bar for cleaner look
  win.setMenuBarVisibility(false);

  // Handle permission requests for camera/microphone
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'camera', 'microphone', 'notifications', 'geolocation'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  if (isDev) {
    // Attempt to connect to Vite dev server
    // We wait a brief moment to allow Vite to start if run concurrently
    setTimeout(() => {
        win.loadURL('http://localhost:5173');
    }, 1000);
    win.webContents.openDevTools();
  } else {
    // Load built files in production
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
