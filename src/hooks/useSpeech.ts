import { useState, useEffect, useRef, useCallback } from 'react'
import { splitSentences } from '../utils/splitSentences'
import { isLearningVoice } from '../utils/voiceUtils'

export type PlayState = 'idle' | 'playing' | 'paused'

// ループ再生の範囲（センテンスのインデックス、両端含む）
export interface LoopRange {
  start: number
  end: number
}

interface UseSpeechOptions {
  rate: number
  // 使用する音声の名前。未指定の場合はリスト先頭を使用する
  voiceName?: string
  // ループ再生する範囲。null の場合は全文を順に再生して終了する
  loopRange?: LoopRange | null
}

interface UseSpeechResult {
  playState: PlayState
  currentSentenceIndex: number
  sentences: string[]
  // 学習に適した英語音声の一覧（voiceschanged 後に確定）
  availableVoices: SpeechSynthesisVoice[]
  // 現在実際に使用している音声名
  currentVoiceName: string
  play: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  restart: () => void
  isSupported: boolean
}

// センテンスとセンテンスの間に入れる無音時間（ms）
const SENTENCE_PAUSE_MS = 500

/**
 * Web Speech API（SpeechSynthesis）を操作するカスタムフック
 * - 学習に適した英語音声のみを一覧として公開する
 * - センテンスごとに発話し、センテンス間に間隔を挟む
 * - loopRange が指定された場合は指定区間をループ再生する
 */
export function useSpeech(text: string, options: UseSpeechOptions): UseSpeechResult {
  const { rate, voiceName, loopRange } = options

  const [playState, setPlayState] = useState<PlayState>('idle')
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1)
  const [sentences, setSentences] = useState<string[]>([])
  const [isSupported] = useState(() => 'speechSynthesis' in window)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  const currentIndexRef = useRef(-1)
  const sentencesRef = useRef<string[]>([])
  const rateRef = useRef(rate)
  const voiceNameRef = useRef(voiceName)
  const loopRangeRef = useRef(loopRange)
  const isPlayingRef = useRef(false)
  // センテンス間ポーズのタイマーID（stop/unmount時にクリアする）
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { rateRef.current = rate }, [rate])
  useEffect(() => { voiceNameRef.current = voiceName }, [voiceName])
  useEffect(() => { loopRangeRef.current = loopRange }, [loopRange])

  // ブラウザの音声リストを取得・監視する
  // Chrome は非同期で読み込まれるため voiceschanged イベントを待つ
  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      // 学習に不適切な音声（ノベルティ・非標準ロケール等）を除いた一覧を公開する
      const voices = speechSynthesis.getVoices().filter(isLearningVoice)
      setAvailableVoices(voices)
    }

    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [isSupported])

  // テキストが変わったらセンテンスを再生成し、再生を停止する
  useEffect(() => {
    const parsed = splitSentences(text)
    setSentences(parsed)
    sentencesRef.current = parsed
    handleStop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  /**
   * 発話に使用する音声を決定する
   * voiceName が指定されていればその名前で探し、なければリスト先頭を使用する
   */
  const resolveVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices().filter(isLearningVoice)
    if (voices.length === 0) return null

    const name = voiceNameRef.current
    if (name) {
      const found = voices.find((v) => v.name === name)
      if (found) return found
    }

    return voices[0]
  }, [])

  /**
   * 指定インデックスのセンテンスを発話する
   * - loopRange が設定されている場合は範囲末尾で先頭へ戻る
   * - loopRange がない場合は全文を順に再生して終了する
   */
  const speakAt = useCallback(
    (index: number) => {
      if (!isPlayingRef.current) return

      const totalSentences = sentencesRef.current.length
      const range = loopRangeRef.current

      // ループ範囲の末尾を超えたら先頭に戻る
      if (range && index > range.end) {
        pauseTimerRef.current = setTimeout(() => speakAt(range.start), SENTENCE_PAUSE_MS)
        return
      }

      // 全文再生完了（ループなし）
      if (!range && index >= totalSentences) {
        setPlayState('idle')
        setCurrentSentenceIndex(-1)
        currentIndexRef.current = -1
        isPlayingRef.current = false
        return
      }

      const utterance = new SpeechSynthesisUtterance(sentencesRef.current[index])
      utterance.rate = rateRef.current
      utterance.lang = 'en-US'

      const voice = resolveVoice()
      if (voice) utterance.voice = voice

      utterance.onstart = () => {
        setCurrentSentenceIndex(index)
        currentIndexRef.current = index
      }

      utterance.onend = () => {
        if (isPlayingRef.current) {
          pauseTimerRef.current = setTimeout(() => speakAt(index + 1), SENTENCE_PAUSE_MS)
        }
      }

      utterance.onerror = (e) => {
        if (e.error === 'interrupted') return
        console.error('SpeechSynthesis error:', e.error)
        setPlayState('idle')
        isPlayingRef.current = false
      }

      speechSynthesis.speak(utterance)
    },
    [resolveVoice]
  )

  const handlePlay = useCallback(() => {
    if (!isSupported || sentencesRef.current.length === 0) return
    speechSynthesis.cancel()
    isPlayingRef.current = true
    setPlayState('playing')
    // ループ範囲が設定されている場合はその先頭から再生する
    const startIndex = loopRangeRef.current?.start ?? 0
    speakAt(startIndex)
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
    // ポーズ中のタイマーを先にクリアし、次センテンス再生を防ぐ
    if (pauseTimerRef.current !== null) {
      clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = null
    }
    speechSynthesis.cancel()
    isPlayingRef.current = false
    setPlayState('idle')
    setCurrentSentenceIndex(-1)
    currentIndexRef.current = -1
  }, [])

  const handleRestart = useCallback(() => {
    handleStop()
    pauseTimerRef.current = setTimeout(() => {
      isPlayingRef.current = true
      setPlayState('playing')
      const startIndex = loopRangeRef.current?.start ?? 0
      speakAt(startIndex)
    }, 100)
  }, [handleStop, speakAt])

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current !== null) {
        clearTimeout(pauseTimerRef.current)
      }
      speechSynthesis.cancel()
      isPlayingRef.current = false
    }
  }, [])

  const currentVoiceName = (() => {
    if (voiceName) {
      const found = availableVoices.find((v) => v.name === voiceName)
      return found ? found.name : ''
    }
    return availableVoices[0]?.name ?? ''
  })()

  return {
    playState,
    currentSentenceIndex,
    sentences,
    availableVoices,
    currentVoiceName,
    play: handlePlay,
    pause: handlePause,
    resume: handleResume,
    stop: handleStop,
    restart: handleRestart,
    isSupported,
  }
}
