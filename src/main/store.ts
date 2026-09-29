import type { AlfredData, AppItem, Idea, Todo } from '../shared/types'
import { getSql } from './db'

// Supabase Postgres(alfred 스키마)에 앱·할일·아이디어 저장
// 렌더러는 전체 데이터를 넘기고, 직전 상태와 비교해 바뀐 항목만 upsert/delete
// → 여러 PC에서 써도 서로의 변경을 덮어쓰지 않음

type TodoRow = {
  id: string
  text: string
  done: boolean
  app_id: string | null
  created_at: string
}
type IdeaRow = { id: string; text: string; app_id: string | null; created_at: string }

// 마지막으로 DB와 일치한 상태 (변경분 계산 기준)
let snapshot: AlfredData = { apps: [], todos: [], ideas: [] }
let queue: Promise<unknown> = Promise.resolve()

// 조회·저장을 순서대로 실행 → 연속 저장 시 변경분 계산이 꼬이지 않게
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.catch(() => {})
  return run
}

// bigint 컬럼은 문자열로 조회됨 → 숫자로 변환
const toTodo = (r: TodoRow): Todo => ({
  id: r.id,
  text: r.text,
  done: r.done,
  ...(r.app_id ? { appId: r.app_id } : {}),
  createdAt: Number(r.created_at)
})

const toIdea = (r: IdeaRow): Idea => ({
  id: r.id,
  text: r.text,
  ...(r.app_id ? { appId: r.app_id } : {}),
  createdAt: Number(r.created_at)
})

export function loadData(): Promise<AlfredData> {
  return serial(async () => {
    const sql = getSql()
    const [apps, todos, ideas] = await Promise.all([
      sql<
        AppItem[]
      >`select id, name, cwd, command, url, port from alfred.apps order by created_at, id`,
      sql<TodoRow[]>`
        select id, text, done, app_id, created_at from alfred.todos order by created_at desc, id
      `,
      sql<IdeaRow[]>`
        select id, text, app_id, created_at from alfred.ideas order by created_at desc, id
      `
    ])
    // 결과 배열의 부가 속성 제거 → IPC로 넘길 순수 객체
    snapshot = {
      apps: apps.map((a) => ({ ...a })),
      todos: todos.map(toTodo),
      ideas: ideas.map(toIdea)
    }
    return snapshot
  })
}

// 새로 생겼거나 내용이 바뀐 항목 + 사라진 항목 id
function diff<T extends { id: string }>(prev: T[], next: T[]): { changed: T[]; removed: string[] } {
  const before = new Map(prev.map((p) => [p.id, JSON.stringify(p)]))
  const nextIds = new Set(next.map((n) => n.id))
  return {
    changed: next.filter((n) => before.get(n.id) !== JSON.stringify(n)),
    removed: prev.filter((p) => !nextIds.has(p.id)).map((p) => p.id)
  }
}

export function saveData(next: AlfredData): Promise<void> {
  return serial(async () => {
    const apps = diff(snapshot.apps, next.apps)
    const todos = diff(snapshot.todos, next.todos)
    const ideas = diff(snapshot.ideas, next.ideas)
    const total = [apps, todos, ideas].reduce((n, d) => n + d.changed.length + d.removed.length, 0)
    if (total === 0) return

    // 전부 성공하거나 전부 취소 (실패 시 snapshot 유지 → 다음 저장 때 다시 반영)
    await getSql().begin(async (tx) => {
      if (apps.changed.length) {
        const rows = apps.changed.map(({ id, name, cwd, command, url, port }) => ({
          id,
          name,
          cwd,
          command,
          url,
          port
        }))
        await tx`
          insert into alfred.apps ${tx(rows)}
          on conflict (id) do update set name = excluded.name, cwd = excluded.cwd,
            command = excluded.command, url = excluded.url, port = excluded.port, updated_at = now()
        `
      }
      if (todos.changed.length) {
        const rows = todos.changed.map((t) => ({
          id: t.id,
          text: t.text,
          done: t.done,
          app_id: t.appId ?? null,
          created_at: t.createdAt
        }))
        await tx`
          insert into alfred.todos ${tx(rows)}
          on conflict (id) do update set text = excluded.text, done = excluded.done,
            app_id = excluded.app_id, updated_at = now()
        `
      }
      if (ideas.changed.length) {
        const rows = ideas.changed.map((i) => ({
          id: i.id,
          text: i.text,
          app_id: i.appId ?? null,
          created_at: i.createdAt
        }))
        await tx`
          insert into alfred.ideas ${tx(rows)}
          on conflict (id) do update set text = excluded.text, app_id = excluded.app_id, updated_at = now()
        `
      }
      if (apps.removed.length) await tx`delete from alfred.apps where id in ${tx(apps.removed)}`
      if (todos.removed.length) await tx`delete from alfred.todos where id in ${tx(todos.removed)}`
      if (ideas.removed.length) await tx`delete from alfred.ideas where id in ${tx(ideas.removed)}`
    })
    snapshot = next
  })
}
