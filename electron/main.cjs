const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Necessary for Firebase Auth cross-origin in file:// protocol
    },
    autoHideMenuBar: true // Modern look without the file menu
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    const express = require('express');
    const server = express();
    server.use(express.static(path.join(__dirname, '../dist')));
    
    server.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    });

    const listener = server.listen(0, '127.0.0.1', () => {
      const port = listener.address().port;
      win.loadURL(`http://localhost:${port}`);
    });
  }

  // Intercept links that open a new window and open them in the default browser instead
  win.webContents.setWindowOpenHandler(({ url }) => {
    // If it's a firebase auth popup, allow it to open in a new electron window
    if (url.includes('firebaseapp.com/__/auth/handler')) {
       return { action: 'allow' };
    }
    // Otherwise open in the user's default browser
    shell.openExternal(url);
    return { action: 'deny' };
  });
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
