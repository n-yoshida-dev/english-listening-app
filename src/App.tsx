import { useEffect, useCallback } from 'react'
import { TextInput } from './components/TextInput'
import { Player } from './components/Player'
import { TranscriptView } from './components/TranscriptView'
import { useSpeech } from './hooks/useSpeech'
import { useLocalStorage } from './hooks/useLocalStorage'
import './index.css'

/**
 * アプリのルートコンポーネント
 * - テキスト入力・TTS再生・ハイライト表示を統合する
 * - テキストと速度設定を localStorage に永続化する
 * - キーボードショートカット（Space / R / S）を登録する
 */
function App() {
  const [text, setText] = useLocalStorage<string>('el-app-text', '')
  const [rate, setRate] = useLocalStorage<number>('el-app-rate', 1.0)

  const { playState, currentSentenceIndex, sentences, play, pause, resume, stop, restart, isSupported } =
    useSpeech(text, { rate })

  const isActive = playState !== 'idle'

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
          onPlay={play}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onRestart={restart}
          onRateChange={setRate}
          disabled={text.trim().length === 0}
        />

        <TranscriptView sentences={sentences} currentIndex={currentSentenceIndex} />
      </main>
    </div>
  )
}

export default App