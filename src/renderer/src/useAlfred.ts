import { useCallback, useEffect, useState } from 'react'
import type { AlfredData, RunStatus } from '../../shared/types'

export const newId = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// 데이터 로드/저장 + 실행 상태 구독 훅
export function useAlfred(): {
  data: AlfredData | null
  update: (fn: (prev: AlfredData) => AlfredData) => void
  status: RunStatus
} {
  const [data, setData] = useState<AlfredData | null>(null)
  const [status, setStatus] = useState<RunStatus>({ running: [], errors: {} })

  useEffect(() => {
    window.alfred.getData().then(setData)
    window.alfred.getStatus().then(setStatus)
    return window.alfred.onStatus(setStatus)
  }, [])

  // 변경 즉시 파일에 저장
  const update = useCallback((fn: (prev: AlfredData) => AlfredData) => {
    setData((prev) => {
      if (!prev) return prev
      const next = fn(prev)
      window.alfred.saveData(next)
      return next
    })
  }, [])

  return { data, update, status }
}
