const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Window controls
  close: () => ipcRenderer.send('window-close'),
  minimize: () => ipcRenderer.send('window-minimize'),
  openExternal: (url) => ipcRenderer.send('open-external', url),

  // Account Management
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  setActiveAccount: (id) => ipcRenderer.invoke('set-active-account', id),
  createOfflineAccount: (name) => ipcRenderer.invoke('create-offline-account', name),
  loginMicrosoft: () => ipcRenderer.invoke('login-microsoft'),
  deleteAccount: (id) => ipcRenderer.invoke('delete-account', id),
  getStoreListings: () => ipcRenderer.invoke('get-store-listings'),
  processPurchase: (id) => ipcRenderer.invoke('process-account-purchase', id),

  // Modrinth API & Mods
  searchModrinth: (data) => ipcRenderer.invoke('search-modrinth', data),
  installModrinth: (data) => ipcRenderer.invoke('install-modrinth', data),
  getLocalMods: () => ipcRenderer.invoke('get-local-mods'),
  toggleMod: (name) => ipcRenderer.invoke('toggle-mod', name),
  deleteMod: (name) => ipcRenderer.invoke('delete-mod', name),
  importModFiles: (paths) => ipcRenderer.invoke('import-mod-files', paths),
  openModsFolder: () => ipcRenderer.send('open-mods-folder'),

  // Configs
  getHudConfig: () => ipcRenderer.invoke('get-hud-config'),
  saveHudConfig: (cfg) => ipcRenderer.invoke('save-hud-config', cfg),
  getBackgroundConfig: () => ipcRenderer.invoke('get-background-config'),
  saveBackgroundConfig: (cfg) => ipcRenderer.invoke('save-background-config', cfg),
  selectCustomBackground: () => ipcRenderer.invoke('select-custom-background'),

  // Game Launcher & Protected Subscriptions
  launch: (data) => ipcRenderer.send('launch-game', data),
  invokeMinecraftLaunch: (data) => ipcRenderer.invoke('launch-minecraft-modded', data),
  fetchAPI: (endpoint) => ipcRenderer.invoke('nmc-fetch-api', endpoint),
  getMandatoryMods: () => ipcRenderer.invoke('get-mandatory-mods'),

  onStatus: (cb) => {
    const handler = (e, v) => {
      try { cb(v); } catch (err) { console.error('onStatus handler error:', err); }
    };
    ipcRenderer.on('status-update', handler);
    return () => ipcRenderer.removeListener('status-update', handler);
  },

  onClosed: (cb) => {
    const handler = () => {
      try { cb(); } catch (err) { console.error('onClosed handler error:', err); }
    };
    ipcRenderer.on('game-closed', handler);
    return () => ipcRenderer.removeListener('game-closed', handler);
  },

  onDownloadProgress: (cb) => {
    const handler = (e, v) => {
      try { cb(v); } catch (err) { console.error('onDownloadProgress handler error:', err); }
    };
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },

  invokeSyncAndLaunch: (payload) => ipcRenderer.invoke('sync-and-launch-mods', payload)
});

// Also expose as nmcAPI for compatibility with user prompt
contextBridge.exposeInMainWorld('nmcAPI', {
  fetchAPI: (endpoint) => ipcRenderer.invoke('nmc-fetch-api', endpoint),
  invokeMinecraftLaunch: (data) => ipcRenderer.invoke('launch-minecraft-modded', data),
  invokeSyncAndLaunch: (payload) => ipcRenderer.invoke('sync-and-launch-mods', payload),
  getMandatoryMods: () => ipcRenderer.invoke('get-mandatory-mods')
});
