// 기존 로컬 파일(%APPDATA%\Alfred\alfred-data.json)을 Supabase alfred 스키마로 1회 이전
// 실행: npm run db:migrate-json  (여러 번 실행해도 같은 id는 덮어쓰기만 함)
// 비밀값 보호: 에러 원문은 출력하지 않고 코드만 표시
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'

let sql
try {
  const file = path.join(process.env.APPDATA ?? '', 'Alfred', 'alfred-data.json')
  const raw = JSON.parse(await readFile(file, 'utf8'))
  if (!process.env.DATABASE_URL) throw Object.assign(new Error(), { code: 'NO_DATABASE_URL' })
  sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 15 })

  // 등록 순서 유지: 배열 순서대로 created_at 부여 / 절대경로 cwd는 폴더 이름으로
  const base = Date.now()
  const apps = (raw.apps ?? []).map((a, i) => ({
    id: a.id,
    name: a.name,
    cwd: path.isAbsolute(a.cwd) ? path.basename(a.cwd) : a.cwd,
    command: a.command,
    url: a.url ?? '',
    port: a.port,
    created_at: base + i
  }))
  const todos = (raw.todos ?? []).map((t) => ({
    id: t.id,
    text: t.text,
    done: Boolean(t.done),
    app_id: t.appId ?? null,
    created_at: t.createdAt
  }))
  const ideas = (raw.ideas ?? []).map((i) => ({
    id: i.id,
    text: i.text,
    app_id: i.appId ?? null,
    created_at: i.createdAt
  }))

  // 전부 성공하거나 전부 취소
  await sql.begin(async (tx) => {
    if (apps.length) {
      await tx`
        insert into alfred.apps ${tx(apps)}
        on conflict (id) do update set name = excluded.name, cwd = excluded.cwd,
          command = excluded.command, url = excluded.url, port = excluded.port, updated_at = now()
      `
    }
    if (todos.length) {
      await tx`
        insert into alfred.todos ${tx(todos)}
        on conflict (id) do update set text = excluded.text, done = excluded.done,
          app_id = excluded.app_id, updated_at = now()
      `
    }
    if (ideas.length) {
      await tx`
        insert into alfred.ideas ${tx(ideas)}
        on conflict (id) do update set text = excluded.text, app_id = excluded.app_id, updated_at = now()
      `
    }
  })

  console.log(`이전 완료: 앱 ${apps.length}건, 할일 ${todos.length}건, 아이디어 ${ideas.length}건`)
} catch (e) {
  console.log('이전 실패:', e?.code ?? e?.name ?? 'UNKNOWN')
  process.exitCode = 1
} finally {
  try {
    await sql?.end({ timeout: 5 })
  } catch {
    // 종료 실패는 무시
  }
}
