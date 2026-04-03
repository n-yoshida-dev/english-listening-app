import type { PlayState, LoopRange } from '../hooks/useSpeech'
import { getVoiceRecommendationLabel } from '../utils/voiceUtils'

interface PlayerProps {
  playState: PlayState
  rate: number
  availableVoices: SpeechSynthesisVoice[]
  currentVoiceName: string
  loopRange: LoopRange | null
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onRestart: () => void
  onRateChange: (rate: number) => void
  onVoiceChange: (name: string) => void
  onLoopRangeClear: () => void
  disabled: boolean
}

const RATE_MIN = 0.5
const RATE_MAX = 2.0
const RATE_STEP = 0.1

/**
 * 再生コントロールパネル
 * Play / Pause / Resume / Stop / Restart・速度調整・音声選択・ループ状態表示を提供する
 */
export function Player({
  playState,
  rate,
  availableVoices,
  currentVoiceName,
  loopRange,
  onPlay,
  onPause,
  onResume,
  onStop,
  onRestart,
  onRateChange,
  onVoiceChange,
  onLoopRangeClear,
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
        {isIdle && (
          <button className="btn btn-primary" onClick={onPlay} disabled={disabled} title="Play (Space)">
            ▶ Play
          </button>
        )}
        {isPlaying && (
          <button className="btn btn-secondary" onClick={onPause} title="Pause (Space)">
            ⏸ Pause
          </button>
        )}
        {isPaused && (
          <button className="btn btn-primary" onClick={onResume} title="Resume (Space)">
            ▶ Resume
          </button>
        )}
        <button
          className="btn btn-secondary"
          onClick={onRestart}
          disabled={isIdle && disabled}
          title="Restart (R)"
        >
          ↩ Restart
        </button>
        <button className="btn btn-danger" onClick={onStop} disabled={isIdle} title="Stop (S)">
          ■ Stop
        </button>
      </div>

      {/* ループ範囲インジケーター */}
      {loopRange && (
        <div className="loop-indicator">
          <span className="loop-indicator-text">
            ループ中: Sentence {loopRange.start + 1} – {loopRange.end + 1}
          </span>
          <button className="loop-indicator-clear" onClick={onLoopRangeClear} title="ループ範囲をクリア">
            ✕
          </button>
        </div>
      )}

      {/* 音声選択 */}
      <div className="player-voice">
        <label className="voice-label" htmlFor="voice-select">Voice</label>
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
        {currentVoiceName && (
          <span className="voice-current">使用中: {currentVoiceName}</span>
        )}
      </div>

      {/* 速度調整（スライダー） */}
      <div className="player-rate">
        <label className="rate-label" htmlFor="rate-slider">Speed</label>
        <input
          id="rate-slider"
          className="rate-slider"
          type="range"
          min={RATE_MIN}
          max={RATE_MAX}
          step={RATE_STEP}
          value={rate}
          onChange={(e) => onRateChange(parseFloat(e.target.value))}
        />
        <span className="rate-value">{rate.toFixed(1)}x</span>
      </div>

      <p className="shortcut-hint">
        Keyboard: <kbd>Space</kbd> Play/Pause &nbsp; <kbd>R</kbd> Restart &nbsp; <kbd>S</kbd> Stop
      </p>
    </div>
  )
}
