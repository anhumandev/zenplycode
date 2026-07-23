const { app, BrowserWindow, shell, Tray, Menu, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

let tray = null;
let mainWindow = null;

// گوش دادن به درخواست باز کردن فایل از Renderer
ipcMain.on('open-file-dialog', (event) => {
    dialog.showOpenDialog({
        title: 'Select a File',
        properties: ['openFile'],
        filters: [
            { name: 'Text Files', extensions: ['txt', 'js', 'html', 'css', 'json', 'md', 'd', 'psl', 'c', 'php'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    }).then(result => {
        if (!result.canceled) {
            const filePath = result.filePaths[0];
            event.reply('selected-file', filePath);
            
            // خواندن محتوای فایل
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading file:', err);
                    event.reply('file-error', err.message);
                    return;
                }
                event.reply('file-content', data);
            });
        }
    }).catch(err => {
        console.error('Dialog error:', err);
        event.reply('file-error', err.message);
    });
});

function createWindow() {
    mainWindow = new BrowserWindow({
        fullscreen: true,
        frame: false,
        transparent: false,
        resizable: true,
        hasShadow: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('resource/index.html');
    
    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.startsWith('http') && !url.includes('localhost')) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });
    
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F11' && input.type === 'keyDown') {
            event.preventDefault();
            mainWindow.hide();
            createTray(mainWindow);
        }
    });
}

function createTray(win) {
    if (tray) return;
    
    const iconPath = path.join(__dirname, 'resource', 'icon.jpg');
    
    tray = new Tray(iconPath);
    tray.setToolTip('ZenPly');
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                win.show();
                tray.destroy();
                tray = null;
            }
        },
        {
            label: 'Hide',
            click: () => {
                win.hide();
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'About',
            click: () => {
                console.log('About ZenPly');
            }
        },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }
    ]);
    
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
        win.show();
        tray.destroy();
        tray = null;
    });
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (tray) {
        tray.destroy();
        tray = null;
    }
});
