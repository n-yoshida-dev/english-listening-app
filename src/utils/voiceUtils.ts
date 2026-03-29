/**
 * 音声関連のユーティリティ
 * - ブラウザ判定
 * - 推奨音声ラベル付与
 * - ブラウザ別デフォルト音声の選択
 */

export type BrowserType = 'chrome' | 'edge' | 'safari' | 'firefox' | 'other'

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

/**
 * 音声に対して「どのブラウザで推奨か」を示すラベルを返す
 * 複数ブラウザで推奨される場合もある（例：標準 en-US は Safari/Firefox で推奨）
 */
export function getVoiceRecommendationLabel(voice: SpeechSynthesisVoice): string {
  const name = voice.name

  // Chrome 搭載の Google Neural TTS
  if (name.startsWith('Google') && voice.lang.startsWith('en')) {
    return 'Chrome推奨'
  }

  // Edge 搭載の Microsoft Neural TTS（名前に "Natural" または "Online" を含む）
  if (name.startsWith('Microsoft') && (name.includes('Natural') || name.includes('Online')) && voice.lang.startsWith('en')) {
    return 'Edge推奨'
  }

  // macOS / iOS Safari の標準英語音声（代表的なもの）
  const safariVoices = ['Samantha', 'Alex', 'Karen', 'Daniel', 'Moira', 'Tessa', 'Veena']
  if (safariVoices.some((n) => name.startsWith(n)) && voice.lang.startsWith('en')) {
    return 'Safari推奨'
  }

  return ''
}

/**
 * ブラウザ種別に応じた推奨音声を返す
 * 見つからない場合は en-US → en-* の順でフォールバックする
 */
export function getDefaultVoiceForBrowser(
  voices: SpeechSynthesisVoice[],
  browser: BrowserType,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null

  if (browser === 'chrome') {
    // Chrome Neural TTS を優先（最も自然）
    return (
      voices.find((v) => v.name === 'Google US English') ??
      voices.find((v) => v.name === 'Google UK English Female') ??
      voices.find((v) => v.name.startsWith('Google') && v.lang.startsWith('en')) ??
      voices.find((v) => v.lang === 'en-US') ??
      voices.find((v) => v.lang.startsWith('en')) ??
      null
    )
  }

  if (browser === 'edge') {
    // Edge の Microsoft Neural TTS を優先
    return (
      voices.find((v) => v.name.startsWith('Microsoft') && v.name.includes('Natural') && v.lang === 'en-US') ??
      voices.find((v) => v.name.startsWith('Microsoft') && v.name.includes('Online') && v.lang === 'en-US') ??
      voices.find((v) => v.name.startsWith('Microsoft') && v.lang === 'en-US') ??
      voices.find((v) => v.lang === 'en-US') ??
      voices.find((v) => v.lang.startsWith('en')) ??
      null
    )
  }

  // Safari / Firefox / その他：標準 en-US を使用
  return (
    voices.find((v) => v.name === 'Samantha' && v.lang === 'en-US') ??
    voices.find((v) => v.lang === 'en-US') ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null
  )
}
