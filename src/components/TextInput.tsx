import { countWords } from '../utils/splitSentences'

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

/**
 * テキスト入力エリアと単語数表示・クリアボタン
 * 再生中は編集不可にしてミス操作を防ぐ
 */
export function TextInput({ value, onChange, disabled }: TextInputProps) {
  const wordCount = countWords(value)

  return (
    <div className="text-input-container">
      <div className="text-input-header">
        <label htmlFor="english-text" className="text-input-label">
          English Text
        </label>
        <div className="text-input-header-right">
          <span className="word-count">{wordCount} words</span>
          {/* テキストをワンタップで消去するボタン。再生中は非表示 */}
          {!disabled && value.length > 0 && (
            <button
              className="btn-clear"
              onClick={() => onChange('')}
              title="Clear text"
              aria-label="Clear text"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>
      <textarea
        id="english-text"
        className="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste English text here..."
        disabled={disabled}
        rows={8}
      />
      {disabled && (
        <p className="text-input-note">Stop playback to edit the text.</p>
      )}
    </div>
  )
}
