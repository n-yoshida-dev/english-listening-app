interface ProgressBarProps {
  currentIndex: number
  totalSentences: number
  currentText: string
}

/**
 * 再生進捗バーと現在読み上げ中のセンテンスを表示する
 * Playerセクション内に配置して、今どこを読んでいるかを一目で把握できるようにする
 */
export function ProgressBar({ currentIndex, totalSentences, currentText }: ProgressBarProps) {
  if (totalSentences === 0) return null

  // 再生前（currentIndex === -1）は 0% とする
  const displayIndex = currentIndex >= 0 ? currentIndex : 0
  const percent = totalSentences > 0
    ? Math.min(((displayIndex + 1) / totalSentences) * 100, 100)
    : 0
  const isActive = currentIndex >= 0

  return (
    <div className="progress-section">
      <div className="progress-header">
        <span className="progress-label">Progress</span>
        <span className="progress-count">
          {isActive ? displayIndex + 1 : 0} / {totalSentences}
        </span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${isActive ? percent : 0}%` }}
        />
      </div>
      <div className="progress-current-text">
        {isActive
          ? currentText
          : 'ここに現在読んでいる文が表示される'
        }
      </div>
    </div>
  )
}
