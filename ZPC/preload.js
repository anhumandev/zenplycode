const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openFileDialog: () => ipcRenderer.send('open-file-dialog'),
    onFileSelected: (callback) => {
        ipcRenderer.on('selected-file', (event, filePath) => callback(filePath));
    },
    onFileContent: (callback) => {
        ipcRenderer.on('file-content', (event, content) => callback(content));
    },
    onFileError: (callback) => {
        ipcRenderer.on('file-error', (event, error) => callback(error));
    }
});
