/**
 * 音声関連のユーティリティ
 * - ブラウザ判定
 * - 学習向け音声のフィルタリング
 * - 推奨音声ラベル付与
 * - ブラウザ別デフォルト音声の選択
 */

export type BrowserType = 'chrome' | 'edge' | 'safari' | 'firefox' | 'other'

// ===== 音声フィルタリング =====

// リスニング学習に適した英語ロケール（標準的なアクセントのみ）
// en-IN（インド）・en-ZA（南アフリカ）等の訛りの強いものは除外
const ALLOWED_LANGS = new Set(['en-US', 'en-GB', 'en-AU', 'en-IE'])

// 学習に不向きなノベルティ・アクセシビリティ用途の音声名（完全一致）
// iOS/macOS でシステムに含まれる特殊音声
const NOVELTY_VOICE_NAMES = new Set([
  'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Bad News', 'Hysterical',
  'Junior', 'Kathy', 'Organ', 'Pipe Organ', 'Princess', 'Ralph', 'Trinoids',
  'Whisper', 'Wobble', 'Zarvox', 'Fred', 'Albert', 'Jester',
])

/**
 * 音声が学習に適しているかを判定する
 * - 許可されたロケール（en-US / en-GB / en-AU / en-IE）のみ通す
 * - ノベルティ音声・非ASCII名（日本語など）は除外する
 */
export function isLearningVoice(voice: SpeechSynthesisVoice): boolean {
  // ロケールチェック
  if (!ALLOWED_LANGS.has(voice.lang)) return false

  // 非ASCII文字を含む名前は除外（日本語ロケールで「ささやき声」等が表示されるケースに対応）
  if (voice.name.split('').some((c) => c.charCodeAt(0) > 127)) return false

  // ノベルティ音声を除外
  if (NOVELTY_VOICE_NAMES.has(voice.name)) return false

  return true
}

// ===== ブラウザ判定 =====

/**
 * userAgent からブラウザ種別を判定する
 * Edge は Chrome の UA も含むため、Edge を先にチェックする
 */
export function detectBrowser(): BrowserType {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'edge'
  if (ua.includes('Chrome/')) return 'chrome'
  if (ua.includes('Safari/')) return 'safari'
  if (ua.includes('Firefox/')) return 'firefox'
  return 'other'
}

// ===== 推奨ラベル =====

/**
 * 音声に対して「どのブラウザで推奨か」を示すラベルを返す
 * ユーザーが自分の環境に合った音声を選びやすいよう補足する
 */
export function getVoiceRecommendationLabel(voice: SpeechSynthesisVoice): string {
  const name = voice.name

  // Chrome 搭載の Google Neural TTS
  if (name.startsWith('Google') && voice.lang.startsWith('en')) {
    return 'Chrome推奨'
  }

  // Edge 搭載の Microsoft Neural TTS（名前に "Natural" または "Online" を含む）
  if (
    name.startsWith('Microsoft') &&
    (name.includes('Natural') || name.includes('Online')) &&
    voice.lang.startsWith('en')
  ) {
    return 'Edge推奨'
  }

  // macOS / iOS Safari の標準英語音声
  const safariVoices = ['Samantha', 'Alex', 'Karen', 'Daniel', 'Moira', 'Tessa', 'Victoria']
  if (safariVoices.some((n) => name.startsWith(n)) && voice.lang.startsWith('en')) {
    return 'Safari推奨'
  }

  return ''
}

// ===== ブラウザ別デフォルト音声 =====

/**
 * ブラウザ種別に応じた推奨音声を返す
 * フィルタ済みの音声リストを受け取り、最適なものを選ぶ
 */
export function getDefaultVoiceForBrowser(
  voices: SpeechSynthesisVoice[],
  browser: BrowserType,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null

  if (browser === 'chrome') {
    return (
      voices.find((v) => v.name === 'Google US English') ??
      voices.find((v) => v.name === 'Google UK English Female') ??
      voices.find((v) => v.name.startsWith('Google') && v.lang === 'en-US') ??
      voices.find((v) => v.lang === 'en-US') ??
      voices[0]
    )
  }

  if (browser === 'edge') {
    return (
      voices.find((v) => v.name.startsWith('Microsoft') && v.name.includes('Natural') && v.lang === 'en-US') ??
      voices.find((v) => v.name.startsWith('Microsoft') && v.name.includes('Online') && v.lang === 'en-US') ??
      voices.find((v) => v.name.startsWith('Microsoft') && v.lang === 'en-US') ??
      voices.find((v) => v.lang === 'en-US') ??
      voices[0]
    )
  }

  // Safari / Firefox / その他
  return (
    voices.find((v) => v.name === 'Samantha' && v.lang === 'en-US') ??
    voices.find((v) => v.lang === 'en-US') ??
    voices[0]
  )
}
