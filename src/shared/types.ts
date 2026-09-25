// 메인/렌더러 공용 데이터 타입

export interface AppItem {
  id: string
  name: string
  cwd: string
  command: string
  url: string
  port: number
}

export interface Todo {
  id: string
  text: string
  done: boolean
  appId?: string
  createdAt: number
}

export interface Idea {
  id: string
  text: string
  appId?: string
  createdAt: number
}

export interface AlfredData {
  apps: AppItem[]
  todos: Todo[]
  ideas: Idea[]
}

// 실행 중인 앱 id 목록 + 최근 오류 메시지
export interface RunStatus {
  running: string[]
  errors: Record<string, string>
}

export interface AlfredAPI {
  getData: () => Promise<AlfredData>
  saveData: (data: AlfredData) => Promise<void>
  startApp: (app: AppItem) => Promise<void>
  stopApp: (id: string) => Promise<void>
  getStatus: () => Promise<RunStatus>
  onStatus: (cb: (status: RunStatus) => void) => () => void
  openUrl: (url: string) => Promise<void>
  openFolder: (path: string) => Promise<void>
  pickFolder: () => Promise<string | null>
}
