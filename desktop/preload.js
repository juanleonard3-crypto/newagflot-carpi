const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('native', {
  platform: 'desktop',
  captureScreen: () => ipcRenderer.invoke('capture'),
  setExpanded: (v) => ipcRenderer.send('expand', v),
  move: (dx, dy) => ipcRenderer.send('move', dx, dy),
});
