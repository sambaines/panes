interface Props {
  label: string
  value: number
  options: number[]
  onChange: (v: number) => void
}

export function WidthPicker({ label, value, options, onChange }: Props) {
  return (
    <div className="width-picker">
      <span className="width-picker__label">{label}</span>
      <div className="width-picker__buttons">
        {options.map(opt => (
          <button
            key={opt}
            className={opt === value ? 'active' : ''}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
