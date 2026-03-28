import { useState, useEffect, useRef, useCallback } from 'react'
import { splitSentences } from '../utils/splitSentences'

export type PlayState = 'idle' | 'playing' | 'paused'

interface UseSpeechOptions {
  rate: number
}

interface UseSpeechResult {
  playState: PlayState
  currentSentenceIndex: number
  sentences: string[]
  play: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  restart: () => void
  isSupported: boolean
}

/**
 * Web Speech API（SpeechSynthesis）を操作するカスタムフック
 * - 英語音声を自動選択する
 * - センテンスごとに発話し、現在のインデックスを追跡する
 */
export function useSpeech(text: string, options: UseSpeechOptions): UseSpeechResult {
  const { rate } = options

  const [playState, setPlayState] = useState<PlayState>('idle')
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1)
  const [sentences, setSentences] = useState<string[]>([])
  const [isSupported] = useState(() => 'speechSynthesis' in window)

  // 現在の発話インデックスを ref でも保持（コールバック内で最新値を参照するため）
  const currentIndexRef = useRef(-1)
  const sentencesRef = useRef<string[]>([])
  const rateRef = useRef(rate)
  const isPlayingRef = useRef(false)

  // rate の変化を ref に反映
  useEffect(() => {
    rateRef.current = rate
  }, [rate])

  // テキストが変わったらセンテンスを再生成し、再生を停止する
  useEffect(() => {
    const parsed = splitSentences(text)
    setSentences(parsed)
    sentencesRef.current = parsed
    handleStop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  /**
   * 英語音声を優先して選択する
   * en-US → en-GB → en-* → フォールバック
   */
  const selectEnglishVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices()
    if (voices.length === 0) return null

    const enUS = voices.find((v) => v.lang === 'en-US')
    if (enUS) return enUS

    const enGB = voices.find((v) => v.lang === 'en-GB')
    if (enGB) return enGB

    const en = voices.find((v) => v.lang.startsWith('en'))
    if (en) return en

    return voices[0]
  }, [])

  /**
   * 指定インデックスのセンテンスを発話する
   * 終了後に次のセンテンスへ連鎖する
   */
  const speakAt = useCallback(
    (index: number) => {
      if (!isPlayingRef.current) return
      if (index >= sentencesRef.current.length) {
        // 全センテンス読了
        setPlayState('idle')
        setCurrentSentenceIndex(-1)
        currentIndexRef.current = -1
        isPlayingRef.current = false
        return
      }

      const utterance = new SpeechSynthesisUtterance(sentencesRef.current[index])
      utterance.rate = rateRef.current
      utterance.lang = 'en-US'

      const voice = selectEnglishVoice()
      if (voice) utterance.voice = voice

      utterance.onstart = () => {
        setCurrentSentenceIndex(index)
        currentIndexRef.current = index
      }

      utterance.onend = () => {
        if (isPlayingRef.current) {
          speakAt(index + 1)
        }
      }

      utterance.onerror = (e) => {
        // 中断による interrupted エラーは無視
        if (e.error === 'interrupted') return
        console.error('SpeechSynthesis error:', e.error)
        setPlayState('idle')
        isPlayingRef.current = false
      }

      speechSynthesis.speak(utterance)
    },
    [selectEnglishVoice]
  )

  const handlePlay = useCallback(() => {
    if (!isSupported || sentencesRef.current.length === 0) return
    speechSynthesis.cancel()
    isPlayingRef.current = true
    setPlayState('playing')
    speakAt(0)
  }, [isSupported, speakAt])

  const handlePause = useCallback(() => {
    if (playState !== 'playing') return
    speechSynthesis.pause()
    setPlayState('paused')
  }, [playState])

  const handleResume = useCallback(() => {
    if (playState !== 'paused') return
    speechSynthesis.resume()
    setPlayState('playing')
  }, [playState])

  const handleStop = useCallback(() => {
    speechSynthesis.cancel()
    isPlayingRef.current = false
    setPlayState('idle')
    setCurrentSentenceIndex(-1)
    currentIndexRef.current = -1
  }, [])

  const handleRestart = useCallback(() => {
    handleStop()
    // cancel() は非同期なので少し待ってから再開
    setTimeout(() => {
      isPlayingRef.current = true
      setPlayState('playing')
      speakAt(0)
    }, 100)
  }, [handleStop, speakAt])

  // アンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      speechSynthesis.cancel()
      isPlayingRef.current = false
    }
  }, [])

  return {
    playState,
    currentSentenceIndex,
    sentences,
    play: handlePlay,
    pause: handlePause,
    resume: handleResume,
    stop: handleStop,
    restart: handleRestart,
    isSupported,
  }
}