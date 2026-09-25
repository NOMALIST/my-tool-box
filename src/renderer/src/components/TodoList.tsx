import { useState } from 'react'
import type { AlfredData } from '../../../shared/types'
import { newId } from '../useAlfred'
import AppSelect from './AppSelect'

interface Props {
  data: AlfredData
  update: (fn: (prev: AlfredData) => AlfredData) => void
}

function TodoList({ data, update }: Props): React.JSX.Element {
  const [text, setText] = useState('')
  const [appId, setAppId] = useState('')
  const [filter, setFilter] = useState('')

  const add = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!text.trim()) return
    update((d) => ({
      ...d,
      todos: [
        {
          id: newId(),
          text: text.trim(),
          done: false,
          appId: appId || undefined,
          createdAt: Date.now()
        },
        ...d.todos
      ]
    }))
    setText('')
  }

  const toggle = (id: string): void =>
    update((d) => ({
      ...d,
      todos: d.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    }))

  const remove = (id: string): void =>
    update((d) => ({ ...d, todos: d.todos.filter((t) => t.id !== id) }))

  const clearDone = (): void => update((d) => ({ ...d, todos: d.todos.filter((t) => !t.done) }))

  const appName = (id?: string): string | undefined => data.apps.find((a) => a.id === id)?.name

  const visible = data.todos.filter((t) => !filter || t.appId === filter)
  // 미완료 먼저, 완료 항목은 아래로
  const sorted = [...visible].sort((a, b) => Number(a.done) - Number(b.done))
  const doneCount = visible.filter((t) => t.done).length

  return (
    <section>
      <form className="card composer" onSubmit={add}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="할일을 입력하고 Enter"
          autoFocus
        />
        <AppSelect apps={data.apps} value={appId} onChange={setAppId} emptyLabel="앱 연결 없음" />
        <button className="btn primary" type="submit">
          추가
        </button>
      </form>

      <div className="toolbar">
        <AppSelect apps={data.apps} value={filter} onChange={setFilter} emptyLabel="전체 보기" />
        {doneCount > 0 && (
          <button className="btn ghost" onClick={clearDone}>
            완료 {doneCount}개 정리
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✓</div>
          <p>할일이 없습니다. 여유로운 하루네요.</p>
        </div>
      ) : (
        <ul className="card list">
          {sorted.map((t) => (
            <li key={t.id} className={`todo ${t.done ? 'done' : ''}`}>
              <button className="check" onClick={() => toggle(t.id)} aria-label="완료 전환">
                {t.done ? '✓' : ''}
              </button>
              <span className="todo-text">{t.text}</span>
              {appName(t.appId) && <span className="chip">{appName(t.appId)}</span>}
              <button className="icon-btn" title="삭제" onClick={() => remove(t.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default TodoList
