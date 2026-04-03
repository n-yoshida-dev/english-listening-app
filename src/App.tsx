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

const SAMPLE_TEXT = `Topic 1: Parental Leave
My wife and I are on parental leave now. We have two daughters. Our older daughter is one and a half years old. Our younger daughter is three months old. We are very busy every day, but I am happy.

In the morning, we wake up early. We change diapers, make milk, and prepare breakfast. Sometimes the baby cries. Sometimes the older child wants to play. We take care of both children together. My wife and I help each other. That is very important.

Parental leave is not a vacation. It is real work at home. I cook, clean, do laundry, and hold the baby. I also play with my older daughter and help her sleep. At night, I am often sleepy, but I do my best.

In May, we will go back to work. I feel a little worried because our life will change again. But I think this time is very special. I can stay close to my children every day. I can see them grow little by little. That makes me very happy. I am tired, but I am thankful for this time with my family.

Topic 2: Daycare
In April, both of my daughters will start daycare. I feel happy, but I also feel nervous. It is a big change for our family.

The first month will be a settling-in period. They will stay at daycare for only a short time at first. After that, they will stay longer. I think this is good, because the children need time to get used to a new place, new teachers, and new friends.

My older daughter and my younger daughter will go to different daycare centers. This is a little hard for us. We want them to go to the same daycare in the future. That is easier for our family. It is also better if the daycare is close to our home.

I think daycare will be good for my children. They can play, learn, and spend time with other children. They can have a daily routine. They can also learn many small things from teachers and friends.

At the same time, I worry a little. Maybe they will cry. Maybe they will get sick. Maybe they will feel lonely at first. But I hope they will slowly enjoy daycare. I want them to feel safe there. I think this new step will help them grow.

Topic 3: Drop-off and Pick-up
From April, daycare drop-off and pick-up will be part of our daily life. My wife and I have different roles. My wife will take our older daughter to daycare by bicycle. I will take our younger daughter to daycare in a stroller. After that, I will come home and work remotely.

This plan is not easy. The two daycare centers are in different places. One is near Shin-Maruko Station, and the other is near Musashi-Nakahara Station. So we have to go in different directions. It takes time and energy.

I think drop-off in the morning will be busy. We have to wake up early, change clothes, prepare bottles, and get the children ready. We also need to leave home on time. If one child is in a bad mood, everything becomes difficult.

Pick-up can also be hard. Sometimes a child may be tired or sleepy. Sometimes a daycare center may call us because a child has a fever. If that happens, we must change our plan quickly.

I hope our daily routine will become smoother little by little. Right now, I feel some stress, but I want to do my best. Taking care of children is not easy, but I want to support my family every day.

Topic 4: Night Crying
My older daughter sometimes cried at night after our younger daughter was born. It was a hard time for us. Now, the baby sleeps with my wife in another room. We do this because we do not want the baby's crying to wake up our older daughter. But I think my older daughter felt a big change in our family.

Sometimes she cried very loudly at night. It was not normal crying. She looked very upset. I was the one who usually took care of her at that time. I was very sleepy, but I had to help her calm down.

First, I tried simple things. I sang to her. I stroked her back. Sometimes that worked, and she went back to sleep. But sometimes it did not work at all. Then I had to hold her in my arms. Sitting on the bed was often not enough. I had to stand up, rock her gently, pat her back, and sing at the same time.

If she still could not calm down, I showed her her favorite anime for a short time. After twenty or thirty minutes, she finally became quiet and went back to bed. It was hard, but I wanted her to feel safe.

Topic 5: How I Calm My Child
When my daughter cries at night, I try to calm her step by step. I do not do everything at once. First, I try easy things. I talk to her in a soft voice. I sing to her. I stroke her back gently. Sometimes she feels safe again and goes back to sleep.

If that does not work, I hold her in my arms. Sometimes she wants to feel close to me. But holding her while sitting is often not enough. So I stand up and rock her slowly. I also pat her back and keep singing. This often works better.

When she is very upset, it takes a long time. I feel tired and sleepy, but I try to stay calm. If I get nervous, she may feel that too. So I try to move slowly and speak gently.

Sometimes, even that is not enough. In that case, I may show her her favorite anime for a short time. After she becomes calm, I take her back to bed. It is not easy, but I have learned that she needs comfort, time, and patience. Every child is different, so I try to find what works for her.

Topic 6: Growth
One of the best parts of parenting is seeing my children grow. Life is busy and sometimes hard, but their growth makes me very happy.

My younger daughter is still very small, but she is changing little by little. She has started to smile more. She also shows more feelings now. When I talk to her, she sometimes looks at me and smiles. That makes me very happy. I feel that she is slowly learning about the world around her.

My older daughter is also growing fast. She cannot speak clearly yet, but she makes many sounds every day. Her sounds are more like words now. I think she wants to talk to us. She also understands more than before. For example, when we say simple things, she often knows what we mean.

I like to watch these small changes. They are not big things, but they are important. A smile, a new sound, or a new action can make me very happy. Children grow step by step. Sometimes I am tired, and sometimes I worry. But when I see their growth, I feel hopeful. I want to stay close to them and support them as they grow.

Topic 7: Montessori Education
I am interested in Montessori education. I do not know everything about it, but I want to try some simple things at home. I think it is a good way for children to learn.

Recently, we ordered a small desk and chair for our child. They are child-sized, so she can sit by herself and use them easily. We are waiting for them to arrive. I am excited because I want to make a small space for her at home.

I also bought a book about Montessori education. I want to learn more. I think children can learn many things by using their hands and doing simple activities. For example, they can move small objects, open and close containers, or put things in order. These activities look simple, but they help children grow.

I want my daughter to enjoy these activities. I do not want to force her. I want her to choose, try, and learn at her own speed. I hope she can become more independent little by little.

I am also thinking about buying some educational toys. I want to choose toys that are simple and useful. I do not need many toys. I just want good ones. I hope Montessori education will help my child learn, grow, and enjoy daily life.`

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
