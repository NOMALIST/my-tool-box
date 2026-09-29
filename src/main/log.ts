import postgres from 'postgres'
import { DbConfigError } from './db'

// 원문 에러(스택·접속 URL 등 비밀값이 섞일 수 있음)는 찍지 않고 안전한 정보만 남김
export function logError(tag: string, e: unknown): void {
  if (e instanceof DbConfigError) {
    console.error(tag, e.name, e.message)
  } else if (e instanceof postgres.PostgresError) {
    // DB 서버가 돌려준 SQL 오류 (접속 정보 미포함)
    console.error(tag, 'PostgresError', e.code, e.message)
  } else if (e instanceof Error) {
    console.error(tag, e.name, (e as NodeJS.ErrnoException).code ?? '')
  } else {
    console.error(tag, '알 수 없는 오류')
  }
}

// 렌더러 화면에 보여줄 안전한 메시지
export function userMessage(e: unknown): string {
  if (e instanceof DbConfigError) return e.message
  if (e instanceof postgres.PostgresError) return `DB 오류 (${e.code})`
  return 'DB 연결 실패 — 네트워크 상태와 접속 정보를 확인하세요.'
}
