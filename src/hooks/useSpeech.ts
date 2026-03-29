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

// センテンスとセンテンスの間に入れる無音時間（ms）
// ピリオドで一息つく自然なリズムを再現する
const SENTENCE_PAUSE_MS = 500

/**
 * Web Speech API（SpeechSynthesis）を操作するカスタムフック
 * - 英語音声を自動選択する（Google Neural ボイス優先）
 * - センテンスごとに発話し、現在のインデックスを追跡する
 * - センテンス間に間隔を挟んで自然なリズムを実現する
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
   * Chrome の Google Neural ボイス（最も自然）を最優先し、
   * 次いで en-US → en-GB → en-* → フォールバックの順で選ぶ
   */
  const selectEnglishVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices()
    if (voices.length === 0) return null

    // Chrome 搭載の Neural TTS ボイスを優先（最も自然な発音・抑揚）
    const googleUS = voices.find((v) => v.name === 'Google US English')
    if (googleUS) return googleUS

    const googleUKFemale = voices.find((v) => v.name === 'Google UK English Female')
    if (googleUKFemale) return googleUKFemale

    // その他の Google 英語ボイス
    const googleEn = voices.find((v) => v.name.startsWith('Google') && v.lang.startsWith('en'))
    if (googleEn) return googleEn

    // フォールバック：OS 付属の英語ボイス
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