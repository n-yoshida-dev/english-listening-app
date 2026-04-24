import { useState, useEffect, useCallback } from 'react'
import { TextInput } from './components/TextInput'
import { Player } from './components/Player'
import { ProgressBar } from './components/ProgressBar'
import { TranscriptView } from './components/TranscriptView'
import { useSpeech } from './hooks/useSpeech'
import type { LoopRange } from './hooks/useSpeech'
import { useLocalStorage } from './hooks/useLocalStorage'
import { detectBrowser, getDefaultVoiceForBrowser } from './utils/voiceUtils'
import './index.css'

const SAMPLE_TEXT = `Topic 1: Parental Leave, Daycare, and Daily Routine

My wife and I are on parental leave now. We have two daughters. Our older daughter is one and a half years old, and our younger daughter is three months old. We are very busy every day, but I am happy.

Parental leave is not a vacation. It is real work at home. In the morning, we wake up early. We change diapers, make milk, prepare breakfast, do laundry, and clean the house. Sometimes the baby cries. Sometimes our older daughter wants to play. My wife and I help each other, and that is very important.

In April, both of my daughters will start daycare. I feel happy, but I also feel nervous. The first month will be a settling-in period. They will stay at daycare for only a short time at first. After that, they will stay longer. I think this is good because children need time to get used to a new place, new teachers, and new friends.

My daughters will go to different daycare centers, so drop-off and pick-up will be a little hard. My wife will take our older daughter by bicycle. I will take our younger daughter in a stroller. After that, I will come home and work remotely.

In May, we will go back to work. I feel a little worried because our life will change again. But I hope our daily routine will become smoother little by little.


Topic 2: Night Crying, Growth, and Montessori Education

After our younger daughter was born, our older daughter sometimes cried at night. It was a hard time for us. The baby sleeps with my wife in another room because we do not want the baby's crying to wake up our older daughter. But I think my older daughter felt a big change in our family.

When she cries at night, I try to calm her step by step. First, I talk to her in a soft voice. I sing to her and stroke her back gently. Sometimes this works, and she goes back to sleep. If that does not work, I hold her in my arms. I stand up, rock her slowly, pat her back, and keep singing. When she is very upset, it takes a long time. Sometimes I show her her favorite anime for a short time. After she becomes calm, I take her back to bed.

Parenting is tiring, but I like seeing my children grow. My younger daughter has started to smile more. My older daughter cannot speak clearly yet, but her sounds are more like words now. She also understands more than before.

I am also interested in Montessori education. I bought a book about it, and we ordered a small child-sized desk and chair. I want my daughter to choose, try, and learn at her own speed. I hope she can become more independent little by little.`

/**
 * アプリのルートコンポーネント
 * - テキスト入力・TTS再生・ループ範囲選択・ハイライト表示を統合する
 * - テキスト・速度・音声名を localStorage に永続化する
 */
function App() {
  const [text, setText] = useLocalStorage<string>('el-app-text', SAMPLE_TEXT)
  const [rate, setRate] = useLocalStorage<number>('el-app-rate', 1.0)
  const [voiceName, setVoiceName] = useLocalStorage<string>('el-app-voice', '')

  // ループ範囲の状態管理
  // pendingLoopStart: 1回目のタップで仮確定した開始点（終了点未設定）
  // loopRange: 開始・終了ともに確定した範囲
  const [pendingLoopStart, setPendingLoopStart] = useState<number | null>(null)
  const [loopRange, setLoopRange] = useState<LoopRange | null>(null)

  const {
    playState,
    currentSentenceIndex,
    sentences,
    availableVoices,
    currentVoiceName,
    play,
    pause,
    resume,
    stop,
    restart,
    isSupported,
  } = useSpeech(text, { rate, voiceName: voiceName || undefined, loopRange })

  const isActive = playState !== 'idle'

  // 初回訪問（voiceName 未設定）かつ音声リスト取得後に、ブラウザ推奨音声を自動選択する
  useEffect(() => {
    if (voiceName !== '' || availableVoices.length === 0) return
    const browser = detectBrowser()
    const recommended = getDefaultVoiceForBrowser(availableVoices, browser)
    if (recommended) setVoiceName(recommended.name)
  }, [availableVoices, voiceName, setVoiceName])

  /**
   * センテンスタップ時のループ範囲選択ロジック
   * - 未選択 → 1回目タップ：開始点を仮設定（pending）
   * - pending 状態 → 同じセンテンスをタップ：そのセンテンス1つをループ確定
   * - pending 状態 → 別のセンテンスをタップ：範囲を確定（min/max で順序を正規化）
   * - 範囲確定後のタップ：クリアして新たに開始点を仮設定
   */
  const handleSentenceClick = useCallback(
    (index: number) => {
      if (loopRange !== null) {
        // 範囲確定済み → クリアして新たに開始点を仮設定
        setLoopRange(null)
        setPendingLoopStart(index)
        return
      }

      if (pendingLoopStart === null) {
        // 未選択 → 開始点を仮設定
        setPendingLoopStart(index)
        return
      }

      if (pendingLoopStart === index) {
        // 同じセンテンスを再タップ → そのセンテンス1つをループ確定
        setLoopRange({ start: index, end: index })
        setPendingLoopStart(null)
        return
      }

      // 別のセンテンスをタップ → 範囲を確定（順序は自動正規化）
      setLoopRange({
        start: Math.min(pendingLoopStart, index),
        end: Math.max(pendingLoopStart, index),
      })
      setPendingLoopStart(null)
    },
    [loopRange, pendingLoopStart]
  )

  const handleLoopRangeClear = useCallback(() => {
    setLoopRange(null)
    setPendingLoopStart(null)
  }, [])

  // テキスト変更時にループ範囲もリセットするラッパー
  const handleTextChange = useCallback(
    (newText: string) => {
      setText(newText)
      setLoopRange(null)
      setPendingLoopStart(null)
    },
    [setText]
  )

  // キーボードショートカット
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (playState === 'idle') play()
          else if (playState === 'playing') pause()
          else if (playState === 'paused') resume()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          restart()
          break
        case 's':
        case 'S':
          e.preventDefault()
          stop()
          break
      }
    },
    [playState, play, pause, resume, restart, stop]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">English Listening</h1>
      </header>

      <main className="app-main">
        {!isSupported && (
          <div className="alert alert-error">
            Your browser does not support the Web Speech API. Please use Chrome or Safari.
          </div>
        )}

        <TextInput value={text} onChange={handleTextChange} disabled={isActive} />

        <Player
          playState={playState}
          rate={rate}
          availableVoices={availableVoices}
          currentVoiceName={currentVoiceName}
          loopRange={loopRange}
          onPlay={play}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onRestart={restart}
          onRateChange={setRate}
          onVoiceChange={setVoiceName}
          onLoopRangeClear={handleLoopRangeClear}
          disabled={text.trim().length === 0}
        />

        <ProgressBar
          currentIndex={currentSentenceIndex}
          totalSentences={sentences.length}
          currentText={sentences[currentSentenceIndex] ?? ''}
        />

        <TranscriptView
          sentences={sentences}
          currentIndex={currentSentenceIndex}
          loopRange={loopRange}
          pendingLoopStart={pendingLoopStart}
          onSentenceClick={handleSentenceClick}
        />
      </main>
    </div>
  )
}

export default App
