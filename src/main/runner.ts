import { spawn, spawnSync, type ChildProcess } from 'child_process'
import type { AppItem, RunStatus } from '../shared/types'
import { withPort } from '../shared/ports'

const processes = new Map<string, ChildProcess>()
const errors: Record<string, string> = {}
let notify: (status: RunStatus) => void = () => {}

export function onStatusChange(cb: (status: RunStatus) => void): void {
  notify = cb
}

export function getStatus(): RunStatus {
  return { running: [...processes.keys()], errors: { ...errors } }
}

export function startApp(item: AppItem): void {
  if (processes.has(item.id)) return
  delete errors[item.id]

  // PORT 환경변수(Next 등) + 명령 내 {port} 치환 → 앱별 고정 포트로 실행
  const child = spawn(withPort(item.command, item.port), {
    cwd: item.cwd,
    env: { ...process.env, PORT: String(item.port) },
    shell: true,
    windowsHide: true,
    stdio: 'ignore'
  })

  child.on('error', (err) => {
    errors[item.id] = err.message
    processes.delete(item.id)
    notify(getStatus())
  })

  child.on('exit', (code) => {
    // 사용자가 중지하지 않았는데 비정상 종료된 경우만 오류로 기록
    if (processes.get(item.id) === child && code !== 0 && code !== null) {
      errors[item.id] = `종료 코드 ${code}`
    }
    if (processes.get(item.id) === child) processes.delete(item.id)
    notify(getStatus())
  })

  processes.set(item.id, child)
  notify(getStatus())
}

// shell: true 로 띄운 프로세스는 cmd 하위에 dev 서버가 붙으므로 트리 전체 종료 필요
function killTree(child: ChildProcess): void {
  if (!child.pid) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true })
  } else {
    child.kill('SIGTERM')
  }
}

export function stopApp(id: string): void {
  const child = processes.get(id)
  if (!child) return
  processes.delete(id)
  killTree(child)
  notify(getStatus())
}

export function stopAll(): void {
  for (const child of processes.values()) killTree(child)
  processes.clear()
}
