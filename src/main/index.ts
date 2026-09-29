import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { loadData, saveData } from './store'
import { appsRoot, toAbsolute, toFolderName } from './paths'
import { startApp, stopApp, stopAll, getStatus, onStatusChange } from './runner'
import type { AlfredData, AppItem } from '../shared/types'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 760,
    minHeight: 540,
    show: false,
    autoHideMenuBar: true,
    title: 'Alfred',
    backgroundColor: '#f6f1e9',
    // macOS는 번들 아이콘(icns) 사용, 그 외 플랫폼은 창 아이콘 직접 지정 (dev 실행 포함)
    ...(process.platform !== 'darwin' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => (mainWindow = null))

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle('data:get', () => loadData())
  ipcMain.handle('data:save', (_, data: AlfredData) => saveData(data))

  ipcMain.handle('app:start', (_, item: AppItem) => startApp(item))
  ipcMain.handle('app:stop', (_, id: string) => stopApp(id))
  ipcMain.handle('app:status', () => getStatus())

  ipcMain.handle('shell:openUrl', (_, url: string) => shell.openExternal(url))
  ipcMain.handle('shell:openFolder', (_, path: string) => shell.openPath(toAbsolute(path)))

  // 기준 폴더(my-app) 바로 아래 폴더만 등록 가능 → 폴더 이름만 반환
  ipcMain.handle('dialog:pickFolder', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      defaultPath: appsRoot(),
      properties: ['openDirectory']
    })
    if (result.canceled) return null
    const name = toFolderName(result.filePaths[0])
    if (!name) {
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        message: '등록할 수 없는 폴더입니다.',
        detail: `${appsRoot()} 바로 아래의 폴더만 등록할 수 있습니다.`
      })
    }
    return name
  })

  // 프로세스 상태 변화 → 렌더러로 푸시
  onStatusChange((status) => mainWindow?.webContents.send('app:status-changed', status))
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.alfred.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpc()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 알프레드 종료 시 실행시킨 dev 서버 모두 정리
app.on('before-quit', () => stopAll())

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
