import { useEffect, useRef } from 'react'

interface TranscriptViewProps {
  sentences: string[]
  currentIndex: number
}

/**
 * センテンスをリスト表示し、現在読んでいる文をハイライトする
 * ハイライト中の文が常にビューポート内に入るようスクロールする
 */
export function TranscriptView({ sentences, currentIndex }: TranscriptViewProps) {
  const activeRef = useRef<HTMLLIElement>(null)

  // 現在のセンテンスが画面内に収まるようスクロール
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentIndex])

  if (sentences.length === 0) return null

  return (
    <div className="transcript-view">
      <h2 className="transcript-title">Transcript</h2>
      <ol className="transcript-list">
        {sentences.map((sentence, i) => (
          <li
            key={i}
            ref={i === currentIndex ? activeRef : null}
            className={`transcript-sentence ${i === currentIndex ? 'active' : ''} ${i < currentIndex ? 'done' : ''}`}
          >
            {sentence}
          </li>
        ))}
      </ol>
    </div>
  )
}
