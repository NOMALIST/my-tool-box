import { useState } from 'react'
import type { AlfredData } from '../../../shared/types'
import { newId } from '../useAlfred'
import AppSelect from './AppSelect'

interface Props {
  data: AlfredData
  update: (fn: (prev: AlfredData) => AlfredData) => void
}

const formatDate = (ts: number): string =>
  new Date(ts).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

function IdeaList({ data, update }: Props): React.JSX.Element {
  const [text, setText] = useState('')
  const [appId, setAppId] = useState('')

  const add = (): void => {
    if (!text.trim()) return
    update((d) => ({
      ...d,
      ideas: [
        { id: newId(), text: text.trim(), appId: appId || undefined, createdAt: Date.now() },
        ...d.ideas
      ]
    }))
    setText('')
  }

  const remove = (id: string): void => {
    if (!confirm('이 아이디어를 삭제할까요?')) return
    update((d) => ({ ...d, ideas: d.ideas.filter((i) => i.id !== id) }))
  }

  const appName = (id?: string): string | undefined => data.apps.find((a) => a.id === id)?.name

  return (
    <section>
      <div className="card idea-composer">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Ctrl+Enter 로 저장
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add()
          }}
          placeholder="떠오른 아이디어를 적어두세요 (Ctrl+Enter 저장)"
          rows={3}
          autoFocus
        />
        <div className="idea-composer-foot">
          <AppSelect apps={data.apps} value={appId} onChange={setAppId} emptyLabel="앱 연결 없음" />
          <button className="btn primary" onClick={add}>
            기록
          </button>
        </div>
      </div>

      {data.ideas.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✦</div>
          <p>아직 기록된 아이디어가 없습니다.</p>
        </div>
      ) : (
        <div className="idea-grid">
          {data.ideas.map((idea) => (
            <article key={idea.id} className="card idea">
              <p className="idea-text">{idea.text}</p>
              <div className="idea-foot">
                <span className="muted">{formatDate(idea.createdAt)}</span>
                {appName(idea.appId) && <span className="chip">{appName(idea.appId)}</span>}
                <button className="icon-btn" title="삭제" onClick={() => remove(idea.id)}>
                  ✕
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default IdeaList
