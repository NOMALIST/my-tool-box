import { useCallback, useEffect, useRef, useState } from 'react'
import type { AlfredData, RunStatus } from '../../shared/types'

export const newId = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// IPC 에러 메시지 앞의 "Error invoking remote method ..." 접두어 제거
const errorText = (e: unknown): string =>
  (e instanceof Error ? e.message : String(e)).replace(
    /^Error invoking remote method '[^']+': (Error: )?/,
    ''
  )

// 데이터 로드/저장 + 실행 상태 구독 훅
export function useAlfred(): {
  data: AlfredData | null
  update: (fn: (prev: AlfredData) => AlfredData) => void
  status: RunStatus
  error: string | null
  reload: () => void
} {
  const [data, setData] = useState<AlfredData | null>(null)
  const [status, setStatus] = useState<RunStatus>({ running: [], errors: {} })
  const [error, setError] = useState<string | null>(null)
  // 조회 도중 수정이 생기면 조회 결과로 덮어쓰지 않도록 수정 횟수 추적
  const version = useRef(0)

  const reload = useCallback(() => {
    const v = version.current
    window.alfred.getData().then(
      (d) => {
        if (version.current !== v) return
        setData(d)
        setError(null)
      },
      (e) => setError(errorText(e))
    )
  }, [])

  useEffect(() => {
    reload()
    window.alfred.getStatus().then(setStatus)
    // 다른 PC에서 바뀐 내용 반영: 창에 다시 들어올 때 재조회
    window.addEventListener('focus', reload)
    const off = window.alfred.onStatus(setStatus)
    return () => {
      window.removeEventListener('focus', reload)
      off()
    }
  }, [reload])

  // 변경 즉시 DB에 저장 (실패 시 오류 표시, 다음 저장 때 함께 재시도)
  const update = useCallback((fn: (prev: AlfredData) => AlfredData) => {
    version.current++
    setData((prev) => {
      if (!prev) return prev
      const next = fn(prev)
      window.alfred.saveData(next).then(
        () => setError(null),
        (e) => setError(errorText(e))
      )
      return next
    })
  }, [])

  return { data, update, status, error, reload }
}
