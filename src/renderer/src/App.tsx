import { useState } from 'react'
import { useAlfred } from './useAlfred'
import AppList from './components/AppList'
import TodoList from './components/TodoList'
import IdeaList from './components/IdeaList'

type Tab = 'apps' | 'todos' | 'ideas'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '늦은 밤이네요'
  if (h < 12) return '좋은 아침입니다'
  if (h < 18) return '좋은 오후입니다'
  return '좋은 저녁입니다'
}

function App(): React.JSX.Element {
  const { data, update, status } = useAlfred()
  const [tab, setTab] = useState<Tab>('apps')

  if (!data) return <div className="loading">Alfred 준비 중…</div>

  const openTodos = data.todos.filter((t) => !t.done).length
  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: 'apps', label: '앱', icon: '▶', count: data.apps.length },
    { key: 'todos', label: '할일', icon: '✓', count: openTodos },
    { key: 'ideas', label: '아이디어', icon: '✦', count: data.ideas.length }
  ]

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name">Alfred</div>
            <div className="brand-sub">개인 개발 비서</div>
          </div>
        </div>

        <nav className="nav">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`nav-item ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
              <span className="nav-count">{t.count}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className={`dot ${status.running.length ? 'on' : ''}`} />
          실행 중 {status.running.length}개
        </div>
      </aside>

      <main className="main">
        <header className="page-head">
          <p className="eyebrow">{greeting()}</p>
          <h1>
            {tab === 'apps' && '로컬 앱'}
            {tab === 'todos' && '할일'}
            {tab === 'ideas' && '아이디어'}
          </h1>
        </header>

        {tab === 'apps' && <AppList data={data} update={update} status={status} />}
        {tab === 'todos' && <TodoList data={data} update={update} />}
        {tab === 'ideas' && <IdeaList data={data} update={update} />}
      </main>
    </div>
  )
}

export default App
