import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync, renameSync } from 'fs'
import { join } from 'path'
import type { AlfredData, AppItem } from '../shared/types'
import { nextPort } from '../shared/ports'

const EMPTY: AlfredData = { apps: [], todos: [], ideas: [] }

export const dataPath = (): string => join(app.getPath('userData'), 'alfred-data.json')

export function loadData(): AlfredData {
  const file = dataPath()
  if (!existsSync(file)) return { ...EMPTY }
  try {
    const parsed: AlfredData = { ...EMPTY, ...JSON.parse(readFileSync(file, 'utf-8')) }
    // 포트 필드 도입 이전 데이터 → 등록 순서대로 포트 배정
    const apps: AppItem[] = []
    for (const a of parsed.apps) {
      apps.push(Number.isInteger(a.port) && a.port > 0 ? a : { ...a, port: nextPort(apps) })
    }
    return { ...parsed, apps }
  } catch (err) {
    console.error('데이터 파일 파싱 실패, 빈 데이터로 시작:', err)
    return { ...EMPTY }
  }
}

export function saveData(data: AlfredData): void {
  // 임시 파일에 쓴 뒤 교체 → 저장 중 종료 시 파일 손상 방지
  const file = dataPath()
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  renameSync(tmp, file)
}
