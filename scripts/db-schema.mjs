// supabase/schema.sql을 Supabase에 적용 (여러 번 실행해도 안전)
// 실행: npm run db:schema
// 비밀값 보호: 에러 원문은 출력하지 않고 코드만 표시
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'

let sql
try {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error(), { code: 'NO_DATABASE_URL' })
  const ddl = await readFile(path.join(process.cwd(), 'supabase', 'schema.sql'), 'utf8')
  sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 15, onnotice: () => {} })
  // 신뢰하는 로컬 SQL 파일 → 여러 문장을 한 번에 실행
  await sql.unsafe(ddl)
  console.log('스키마 적용 완료: alfred')
} catch (e) {
  console.log('스키마 적용 실패:', e?.code ?? e?.name ?? 'UNKNOWN')
  process.exitCode = 1
} finally {
  try {
    await sql?.end({ timeout: 5 })
  } catch {
    // 종료 실패는 무시
  }
}
