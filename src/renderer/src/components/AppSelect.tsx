import type { AppItem } from '../../../shared/types'

interface Props {
  apps: AppItem[]
  value: string
  onChange: (id: string) => void
  emptyLabel: string
}

// 할일/아이디어에서 앱 연결·필터용 공용 셀렉트
function AppSelect({ apps, value, onChange, emptyLabel }: Props): React.JSX.Element {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{emptyLabel}</option>
      {apps.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  )
}

export default AppSelect
