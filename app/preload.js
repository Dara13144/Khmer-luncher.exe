const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nmcAPI', {
  // Frameless Window Controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // FiveM Integration
  connectFiveM: (host, port) => ipcRenderer.invoke('connect-fivem', { host, port }),

  // Minecraft Bedrock Edition (UWP & Packs)
  launchBedrock: (serverName, serverAddress) => 
    ipcRenderer.invoke('launch-bedrock', { serverName, serverAddress }),
  installBedrockPack: () => ipcRenderer.invoke('install-bedrock-pack'),

  // Minecraft Java 1.21.1 & Fabric Mods
  invokeMinecraftLaunch: (data) => ipcRenderer.invoke('launch-minecraft', data),
  getMandatoryMods: () => ipcRenderer.invoke('get-mandatory-mods'),
  invokeSyncAndLaunch: (payload) => ipcRenderer.invoke('sync-and-launch-mods', payload),

  // Local Server & API Bridge
  fetchAPI: (endpoint) => ipcRenderer.invoke('nmc-fetch-api', endpoint),

  // External URLs & Community Links
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
