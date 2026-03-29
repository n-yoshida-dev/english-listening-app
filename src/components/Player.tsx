import type { PlayState } from '../hooks/useSpeech'
import { getVoiceRecommendationLabel } from '../utils/voiceUtils'

interface PlayerProps {
  playState: PlayState
  rate: number
  availableVoices: SpeechSynthesisVoice[]
  currentVoiceName: string
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onRestart: () => void
  onRateChange: (rate: number) => void
  onVoiceChange: (name: string) => void
  disabled: boolean
}

// 速度の選択肢（0.5x〜2.0x、0.25刻み）
const RATE_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]

/**
 * 再生コントロールパネル
 * Play / Pause / Resume / Stop / Restart・速度調整・音声選択を提供する
 * キーボードショートカット：Space=再生/一時停止、R=最初から、S=停止
 */
export function Player({
  playState,
  rate,
  availableVoices,
  currentVoiceName,
  onPlay,
  onPause,
  onResume,
  onStop,
  onRestart,
  onRateChange,
  onVoiceChange,
  disabled,
}: PlayerProps) {
  const isIdle = playState === 'idle'
  const isPlaying = playState === 'playing'
  const isPaused = playState === 'paused'

  /**
   * セレクトボックスに表示する音声名を組み立てる
   * 推奨ブラウザがある場合は「Voice Name (Chrome推奨)」のように付記する
   */
  const formatVoiceOption = (voice: SpeechSynthesisVoice): string => {
    const label = getVoiceRecommendationLabel(voice)
    return label ? `${voice.name}  (${label})` : voice.name
  }

  return (
    <div className="player">
      <div className="player-controls">
        {/* 再生 / 一時停止 / 再開ボタン */}
        {isIdle && (
          <button
            className="btn btn-primary"
            onClick={onPlay}
            disabled={disabled}
            title="Play (Space)"
          >
            ▶ Play
          </button>
        )}
        {isPlaying && (
          <button
            className="btn btn-secondary"
            onClick={onPause}
            title="Pause (Space)"
          >
            ⏸ Pause
          </button>
        )}
        {isPaused && (
          <button
            className="btn btn-primary"
            onClick={onResume}
            title="Resume (Space)"
          >
            ▶ Resume
          </button>
        )}

        {/* 最初から */}
        <button
          className="btn btn-secondary"
          onClick={onRestart}
          disabled={isIdle && disabled}
          title="Restart (R)"
        >
          ↩ Restart
        </button>

        {/* 停止 */}
        <button
          className="btn btn-danger"
          onClick={onStop}
          disabled={isIdle}
          title="Stop (S)"
        >
          ■ Stop
        </button>
      </div>

      {/* 音声選択 */}
      <div className="player-voice">
        <label className="voice-label" htmlFor="voice-select">
          Voice
        </label>
        <select
          id="voice-select"
          className="voice-select"
          value={currentVoiceName}
          onChange={(e) => onVoiceChange(e.target.value)}
          disabled={!isIdle}
        >
          {availableVoices.length === 0 ? (
            <option value="">Loading voices...</option>
          ) : (
            availableVoices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {formatVoiceOption(voice)}
              </option>
            ))
          )}
        </select>
        {/* 現在選択中の音声名を補足表示（セレクトが折りたたまれている状態でも確認できる） */}
        {currentVoiceName && (
          <span className="voice-current">使用中: {currentVoiceName}</span>
        )}
      </div>

      {/* 速度調整 */}
      <div className="player-rate">
        <label className="rate-label">Speed</label>
        <div className="rate-buttons">
          {RATE_OPTIONS.map((r) => (
            <button
              key={r}
              className={`btn btn-rate ${rate === r ? 'active' : ''}`}
              onClick={() => onRateChange(r)}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>

      {/* キーボードショートカット説明 */}
      <p className="shortcut-hint">
        Keyboard: <kbd>Space</kbd> Play/Pause &nbsp; <kbd>R</kbd> Restart &nbsp; <kbd>S</kbd> Stop
      </p>
    </div>
  )
}
