import { app } from 'electron'
import { join } from 'path'
import postgres from 'postgres'
import { appsRoot } from './paths'

// Supabase Postgres 접속 (main 프로세스 전용 — 렌더러에는 접속 정보 노출 안 함)

type Sql = ReturnType<typeof postgres>

// 접속 설정 오류 (메시지에 비밀값 미포함 → 그대로 로그·화면 표시 가능)
export class DbConfigError extends Error {
  name = 'DbConfigError'
}

let sql: Sql | null = null

// 실행 시 .env.local에서 로드 (빌드 산출물·git에 비밀값을 넣지 않기 위해)
// 우선순위: 앱 폴더 자체 파일 → my-app 공유 파일 (이미 있는 값은 덮어쓰지 않음)
function loadEnv(): void {
  for (const dir of [app.getAppPath(), appsRoot()]) {
    if (process.env.DATABASE_URL) return
    try {
      process.loadEnvFile(join(dir, '.env.local'))
    } catch {
      // 파일 없음 → 다음 위치 확인, 끝내 없으면 getSql에서 안내
    }
  }
}

export function getSql(): Sql {
  if (sql) return sql

  loadEnv()
  const url = process.env.DATABASE_URL
  if (!url) throw new DbConfigError('DATABASE_URL이 없습니다. my-app/.env.local을 확인하세요.')
  // 형식이 깨진 URL은 라이브러리 에러에 원문(비밀번호 포함)이 찍히므로 미리 걸러냄
  try {
    new URL(url)
  } catch {
    throw new DbConfigError('DATABASE_URL 형식이 올바르지 않습니다. 특수문자 인코딩을 확인하세요.')
  }

  sql = postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 15 })
  return sql
}
