import { contextBridge, ipcRenderer } from 'electron'
import type { AlfredAPI, RunStatus } from '../shared/types'

// 렌더러에 노출할 알프레드 API
const api: AlfredAPI = {
  getData: () => ipcRenderer.invoke('data:get'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  startApp: (app) => ipcRenderer.invoke('app:start', app),
  stopApp: (id) => ipcRenderer.invoke('app:stop', id),
  getStatus: () => ipcRenderer.invoke('app:status'),
  onStatus: (cb) => {
    const listener = (_: unknown, status: RunStatus): void => cb(status)
    ipcRenderer.on('app:status-changed', listener)
    return () => ipcRenderer.removeListener('app:status-changed', listener)
  },
  openUrl: (url) => ipcRenderer.invoke('shell:openUrl', url),
  openFolder: (path) => ipcRenderer.invoke('shell:openFolder', path),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('alfred', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (index.d.ts 에 정의)
  window.alfred = api
}
