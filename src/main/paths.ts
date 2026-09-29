import { app } from 'electron'
import { dirname, isAbsolute, relative, resolve, sep } from 'path'

// 로컬 앱 기준 폴더(my-app) = 알프레드 프로젝트의 상위 폴더
// 모든 로컬 앱은 이 폴더 바로 아래에 폴더 단위로 존재 → cwd는 폴더 이름만 저장해 PC 간 공유
// 기준 폴더의 상위 위치는 PC마다 달라도 됨 (실행 시 계산)
export const appsRoot = (): string => dirname(app.getAppPath())

// 저장된 폴더 이름 → 실행용 절대경로
export const toAbsolute = (cwd: string): string => resolve(appsRoot(), cwd)

// 절대경로 → 폴더 이름 (기준 폴더 바로 아래가 아니면 null)
export function toFolderName(path: string): string | null {
  const rel = relative(appsRoot(), resolve(path))
  if (!rel || rel.startsWith('..') || isAbsolute(rel) || rel.includes(sep)) return null
  return rel
}
