import { useState } from 'react'
import type { AlfredData, AppItem, RunStatus } from '../../../shared/types'
import { newId } from '../useAlfred'
import { nextPort, withPort } from '../../../shared/ports'

interface Props {
  data: AlfredData
  update: (fn: (prev: AlfredData) => AlfredData) => void
  status: RunStatus
}

// {port} 자리표시자 → 실행 시 앱 포트로 치환 (Next·Vite 모두 --port 인식)
const newForm = (port: number): Omit<AppItem, 'id'> => ({
  name: '',
  cwd: '',
  command: 'npm run dev -- --port {port}',
  url: 'http://localhost:{port}',
  port
})

function AppList({ data, update, status }: Props): React.JSX.Element {
  // editing: null = 폼 닫힘, '' = 신규, 그 외 = 수정 중인 앱 id
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(() => newForm(nextPort(data.apps)))

  const openForm = (item?: AppItem): void => {
    setForm(
      item
        ? { name: item.name, cwd: item.cwd, command: item.command, url: item.url, port: item.port }
        : newForm(nextPort(data.apps))
    )
    setEditing(item ? item.id : '')
  }

  const pickFolder = async (): Promise<void> => {
    const folder = await window.alfred.pickFolder()
    if (!folder) return
    // 이름이 비어 있으면 폴더명으로 자동 채움
    const base = folder.split(/[\\/]/).pop() ?? ''
    setForm((f) => ({ ...f, cwd: folder, name: f.name || base }))
  }

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!form.name.trim() || !form.cwd.trim() || !form.command.trim() || !form.port) return
    update((d) => ({
      ...d,
      apps: editing
        ? d.apps.map((a) => (a.id === editing ? { ...a, ...form } : a))
        : [...d.apps, { id: newId(), ...form }]
    }))
    setEditing(null)
  }

  const remove = (item: AppItem): void => {
    if (!confirm(`"${item.name}" 앱을 삭제할까요?`)) return
    window.alfred.stopApp(item.id)
    update((d) => ({ ...d, apps: d.apps.filter((a) => a.id !== item.id) }))
  }

  // 같은 포트를 쓰는 다른 앱 (충돌 경고용)
  const portConflict = data.apps.find((a) => a.id !== editing && a.port === form.port)

  const pendingTodos = (id: string): number =>
    data.todos.filter((t) => t.appId === id && !t.done).length

  return (
    <section>
      <div className="toolbar">
        <p className="muted">등록한 로컬 프로젝트를 클릭 한 번으로 실행하고 중지합니다.</p>
        <button className="btn primary" onClick={() => openForm()}>
          + 앱 등록
        </button>
      </div>

      {editing !== null && (
        <form className="card form" onSubmit={submit}>
          <h3>{editing ? '앱 수정' : '새 앱 등록'}</h3>
          <div className="grid-3">
            <label>
              이름
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="my-next-app"
                autoFocus
              />
            </label>
            <label>
              포트
              <input
                type="number"
                value={form.port || ''}
                onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
              />
            </label>
            <label>
              URL
              <input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="http://localhost:{port}"
              />
            </label>
          </div>
          {portConflict && (
            <p className="error-text">
              포트 {form.port}번은 &lsquo;{portConflict.name}&rsquo;에서 사용 중입니다.
            </p>
          )}
          <label>
            폴더
            <div className="input-row">
              <input
                value={form.cwd}
                onChange={(e) => setForm({ ...form, cwd: e.target.value })}
                placeholder="C:\work\my-app\..."
              />
              <button type="button" className="btn" onClick={pickFolder}>
                찾아보기
              </button>
            </div>
          </label>
          <label>
            실행 명령
            <input
              value={form.command}
              onChange={(e) => setForm({ ...form, command: e.target.value })}
              placeholder="npm run dev -- --port {port}"
            />
            <span className="hint">
              {'{port}'}는 실행 시 포트 번호로 치환 · PORT 환경변수도 함께 전달
            </span>
          </label>
          <div className="form-actions">
            <button type="button" className="btn ghost" onClick={() => setEditing(null)}>
              취소
            </button>
            <button type="submit" className="btn primary">
              저장
            </button>
          </div>
        </form>
      )}

      {data.apps.length === 0 && editing === null ? (
        <div className="empty">
          <div className="empty-icon">▶</div>
          <p>아직 등록된 앱이 없습니다.</p>
          <p className="muted">＋ 앱 등록 버튼으로 첫 프로젝트를 추가해 보세요.</p>
        </div>
      ) : (
        <div className="app-grid">
          {data.apps.map((item) => {
            const running = status.running.includes(item.id)
            const error = status.errors[item.id]
            const todos = pendingTodos(item.id)
            return (
              <article key={item.id} className={`card app-card ${running ? 'running' : ''}`}>
                <div className="app-head">
                  <div className="app-avatar">{item.name.charAt(0).toUpperCase()}</div>
                  <div className="app-title">
                    <h3>{item.name}</h3>
                    <span className={`badge ${running ? 'on' : error ? 'err' : ''}`}>
                      <span className="dot" />
                      {running ? '실행 중' : error ? '오류' : '중지됨'}
                    </span>
                  </div>
                  <div className="app-menu">
                    <button className="icon-btn" title="수정" onClick={() => openForm(item)}>
                      ✎
                    </button>
                    <button className="icon-btn" title="삭제" onClick={() => remove(item)}>
                      ✕
                    </button>
                  </div>
                </div>

                <dl className="app-meta">
                  <dt>명령</dt>
                  <dd>
                    <code>{withPort(item.command, item.port)}</code>
                  </dd>
                  <dt>폴더</dt>
                  <dd>
                    <button className="link" onClick={() => window.alfred.openFolder(item.cwd)}>
                      {item.cwd}
                    </button>
                  </dd>
                  <dt>포트</dt>
                  <dd>{item.port}</dd>
                  {item.url && (
                    <>
                      <dt>URL</dt>
                      <dd>{withPort(item.url, item.port)}</dd>
                    </>
                  )}
                </dl>

                {error && !running && <p className="error-text">{error}</p>}

                <div className="app-actions">
                  {running ? (
                    <button className="btn stop" onClick={() => window.alfred.stopApp(item.id)}>
                      ■ 중지
                    </button>
                  ) : (
                    <button className="btn primary" onClick={() => window.alfred.startApp(item)}>
                      ▶ 실행
                    </button>
                  )}
                  {item.url && (
                    <button
                      className="btn"
                      onClick={() => window.alfred.openUrl(withPort(item.url, item.port))}
                    >
                      열기 ↗
                    </button>
                  )}
                  {todos > 0 && <span className="chip">할일 {todos}</span>}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default AppList
