import { useEffect, useCallback } from 'react'
import { TextInput } from './components/TextInput'
import { Player } from './components/Player'
import { TranscriptView } from './components/TranscriptView'
import { useSpeech } from './hooks/useSpeech'
import { useLocalStorage } from './hooks/useLocalStorage'
import { detectBrowser, getDefaultVoiceForBrowser } from './utils/voiceUtils'
import './index.css'

// 初回訪問時にテキスト欄に表示するサンプル文
const SAMPLE_TEXT = `My wife and I are on parental leave now. We have two daughters. Our older daughter is one and a half years old. Our younger daughter is three months old. We are very busy every day, but I am happy.

In the morning, we wake up early. We change diapers, make milk, and prepare breakfast. Sometimes the baby cries. Sometimes the older child wants to play. We take care of both children together. My wife and I help each other. That is very important.

Parental leave is not a vacation. It is real work at home. I cook, clean, do laundry, and hold the baby. I also play with my older daughter and help her sleep. At night, I am often sleepy, but I do my best.

In May, we will go back to work. I feel a little worried because our life will change again. But I think this time is very special. I can stay close to my children every day. I can see them grow little by little. That makes me very happy. I am tired, but I am thankful for this time with my family.`

/**
 * アプリのルートコンポーネント
 * - テキスト入力・TTS再生・ハイライト表示を統合する
 * - テキスト・速度・音声名を localStorage に永続化する
 * - キーボードショートカット（Space / R / S）を登録する
 */
function App() {
  // localStorage にテキストが未保存の場合はサンプルテキストを初期値にする
  const [text, setText] = useLocalStorage<string>('el-app-text', SAMPLE_TEXT)
  const [rate, setRate] = useLocalStorage<number>('el-app-rate', 1.0)
  // 音声名。空文字は「自動選択（初回訪問）」を意味する
  const [voiceName, setVoiceName] = useLocalStorage<string>('el-app-voice', '')

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
  } = useSpeech(text, { rate, voiceName: voiceName || undefined })

  const isActive = playState !== 'idle'

  // 初回訪問（voiceName 未設定）かつ音声リスト取得後に、ブラウザ推奨音声を自動選択する
  useEffect(() => {
    if (voiceName !== '' || availableVoices.length === 0) return
    const browser = detectBrowser()
    const recommended = getDefaultVoiceForBrowser(availableVoices, browser)
    if (recommended) {
      setVoiceName(recommended.name)
    }
  }, [availableVoices, voiceName, setVoiceName])

  // キーボードショートカット
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // textarea にフォーカス中はショートカットを無効化
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

        <TextInput value={text} onChange={setText} disabled={isActive} />

        <Player
          playState={playState}
          rate={rate}
          availableVoices={availableVoices}
          currentVoiceName={currentVoiceName}
          onPlay={play}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onRestart={restart}
          onRateChange={setRate}
          onVoiceChange={setVoiceName}
          disabled={text.trim().length === 0}
        />

        <TranscriptView sentences={sentences} currentIndex={currentSentenceIndex} />
      </main>
    </div>
  )
}

export default App
