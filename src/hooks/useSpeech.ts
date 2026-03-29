import { useState, useEffect, useRef, useCallback } from 'react'
import { splitSentences } from '../utils/splitSentences'

export type PlayState = 'idle' | 'playing' | 'paused'

interface UseSpeechOptions {
  rate: number
  // 使用する音声の名前。未指定の場合はブラウザ推奨音声を自動選択する
  voiceName?: string
}

interface UseSpeechResult {
  playState: PlayState
  currentSentenceIndex: number
  sentences: string[]
  // 利用可能な英語音声の一覧（voiceschanged 後に確定）
  availableVoices: SpeechSynthesisVoice[]
  // 現在実際に使用している音声名（未選択時は空文字）
  currentVoiceName: string
  play: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  restart: () => void
  isSupported: boolean
}

// センテンスとセンテンスの間に入れる無音時間（ms）
// ピリオドで一息つく自然なリズムを再現する
const SENTENCE_PAUSE_MS = 500

/**
 * Web Speech API（SpeechSynthesis）を操作するカスタムフック
 * - 利用可能な英語音声を一覧として公開し、外部から選択できるようにする
 * - センテンスごとに発話し、センテンス間に間隔を挟む
 */
export function useSpeech(text: string, options: UseSpeechOptions): UseSpeechResult {
  const { rate, voiceName } = options

  const [playState, setPlayState] = useState<PlayState>('idle')
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1)
  const [sentences, setSentences] = useState<string[]>([])
  const [isSupported] = useState(() => 'speechSynthesis' in window)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  // 現在の発話インデックスを ref でも保持（コールバック内で最新値を参照するため）
  const currentIndexRef = useRef(-1)
  const sentencesRef = useRef<string[]>([])
  const rateRef = useRef(rate)
  const voiceNameRef = useRef(voiceName)
  const isPlayingRef = useRef(false)

  // rate・voiceName の変化を ref に反映
  useEffect(() => { rateRef.current = rate }, [rate])
  useEffect(() => { voiceNameRef.current = voiceName }, [voiceName])

  // ブラウザの音声リストを取得・監視する
  // Chrome は非同期で読み込まれるため voiceschanged イベントを待つ必要がある
  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      // 英語音声のみに絞り込んで一覧として提供する
      const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'))
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
   * voiceName が指定されていればその名前で探し、なければ利用可能な最初の英語音声を返す
   */
  const resolveVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'))
    if (voices.length === 0) return null

    const name = voiceNameRef.current
    if (name) {
      const found = voices.find((v) => v.name === name)
      if (found) return found
    }

    // voiceName 未指定またはマッチしない場合は最初の英語音声を使用
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

      const voice = resolveVoice()
      if (voice) utterance.voice = voice

      utterance.onstart = () => {
        setCurrentSentenceIndex(index)
        currentIndexRef.current = index
      }

      utterance.onend = () => {
        if (isPlayingRef.current) {
          // センテンス間に間隔を挟んで自然なリズムにする
          setTimeout(() => speakAt(index + 1), SENTENCE_PAUSE_MS)
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
    [resolveVoice]
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

  // 現在実際に使用している音声名を導出する
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
