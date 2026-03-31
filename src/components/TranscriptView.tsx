import { useEffect, useRef } from 'react'
import type { LoopRange } from '../hooks/useSpeech'

// スクロールとタップを区別するための移動量しきい値（px）
const SCROLL_THRESHOLD = 8

interface TranscriptViewProps {
  sentences: string[]
  currentIndex: number
  // 選択中のループ範囲（null = 未設定）
  loopRange: LoopRange | null
  // 選択確定前の「開始点のみ指定済み」状態
  pendingLoopStart: number | null
  // センテンスをタップ/クリックしたときのコールバック
  onSentenceClick: (index: number) => void
}

/**
 * センテンスをリスト表示し、現在読んでいる文をハイライトする
 * タップ/クリックでループ範囲を選択できる
 * - 1回目のタップ：ループ開始点を仮設定（pending 状態）
 * - 2回目のタップ：別のセンテンスで終了点を確定 / 同じセンテンスでキャンセル
 * - 範囲確定後のタップ：選択をクリアして新たに開始点を仮設定
 */
export function TranscriptView({
  sentences,
  currentIndex,
  loopRange,
  pendingLoopStart,
  onSentenceClick,
}: TranscriptViewProps) {
  const activeRef = useRef<HTMLLIElement>(null)
  // タッチ開始時の Y 座標を保持する（スクロールとタップの判別に使用）
  const touchStartY = useRef<number>(0)

  // 現在のセンテンスが画面内に収まるようスクロール
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentIndex])

  if (sentences.length === 0) return null

  /**
   * センテンスの CSS クラスを決定する
   * active（現在再生中）・done（読了）・loop-range（ループ選択内）・
   * loop-pending（開始点仮設定中）を組み合わせる
   */
  const getClassName = (i: number): string => {
    const classes = ['transcript-sentence']

    if (i === currentIndex) classes.push('active')
    else if (i < currentIndex) classes.push('done')

    if (loopRange && i >= loopRange.start && i <= loopRange.end) {
      classes.push('loop-range')
    } else if (pendingLoopStart === i) {
      classes.push('loop-pending')
    }

    return classes.join(' ')
  }

  return (
    <div className="transcript-view">
      <div className="transcript-header">
        <h2 className="transcript-title">Transcript</h2>
        {/* 状態に応じたループ操作ガイド */}
        {loopRange === null && pendingLoopStart === null && (
          <span className="loop-guide loop-guide--hint">センテンスをタップしてループ範囲を設定</span>
        )}
        {pendingLoopStart !== null && loopRange === null && (
          <span className="loop-guide">同じ文をもう一度タップ → 1文ループ / 別の文をタップ → 範囲ループ</span>
        )}
      </div>

      <ol className="transcript-list">
        {sentences.map((sentence, i) => (
          <li
            key={i}
            ref={i === currentIndex ? activeRef : null}
            className={getClassName(i)}
            onClick={() => onSentenceClick(i)}
            // スマホでのタップ時に hover 状態が残らないよう touch イベントも処理する
            onTouchStart={(e) => {
              touchStartY.current = e.touches[0].clientY
            }}
            onTouchEnd={(e) => {
              // 指の移動量がしきい値を超えていればスクロール操作とみなしてスキップ
              const moved = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
              if (moved > SCROLL_THRESHOLD) return
              e.preventDefault()
              onSentenceClick(i)
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSentenceClick(i)}
            aria-label={`Sentence ${i + 1}${loopRange && i >= loopRange.start && i <= loopRange.end ? ' (in loop range)' : ''}`}
          >
            <span className="sentence-number">{i + 1}</span>
            <span className="sentence-text">{sentence}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
