import type { AppItem } from './types'

// 앱 포트 배정 규칙: 첫 앱 3100, 이후 등록 앱은 기존 최대 포트 + 1
export const BASE_PORT = 3100

export function nextPort(apps: Pick<AppItem, 'port'>[]): number {
  const used = apps.map((a) => a.port).filter((p) => Number.isInteger(p) && p > 0)
  return used.length ? Math.max(BASE_PORT - 1, ...used) + 1 : BASE_PORT
}

// 실행 명령·URL 안의 {port} 자리표시자를 실제 포트로 치환
export const withPort = (text: string, port: number): string =>
  text.replace(/\{port\}/g, String(port))
