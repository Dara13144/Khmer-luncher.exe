import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  close: () => ipcRenderer.send('window-close'),
  minimize: () => ipcRenderer.send('window-minimize'),
  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  launch: (data: any) => ipcRenderer.send('launch-game', data),
  launchGame: (data: any) => ipcRenderer.send('launch-game', data),
  getHudConfig: () => ipcRenderer.invoke('get-hud-config'),
  saveHudConfig: (config: any) => ipcRenderer.invoke('save-hud-config', config),
  saveLocalCape: (username: string, data: any) => ipcRenderer.invoke('save-local-cape', { username, ...data }),
  getEquippedCape: (username: string) => ipcRenderer.invoke('get-equipped-cape', username),
});
