/**
 * 英文をセンテンス単位に分割する
 * Mr. / Dr. / U.S. などの略語での误分割を防ぐ
 */

// 分割しない略語パターン
const ABBREVIATIONS = [
  'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr', 'Rev', 'Gen', 'Sgt',
  'Cpl', 'Pvt', 'Capt', 'Lt', 'Col', 'Gov', 'Pres', 'Sen', 'Rep',
  'St', 'Ave', 'Blvd', 'Dept', 'Est', 'Inc', 'Ltd', 'Corp', 'Co',
  'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  'vs', 'etc', 'e.g', 'i.e', 'cf', 'al', 'approx', 'fig',
]

const ABBREV_PATTERN = new RegExp(
  `\\b(${ABBREVIATIONS.join('|')})\\.`,
  'g'
)

// 頭字語パターン（U.S.A. など）
const ACRONYM_PATTERN = /\b[A-Z](\.[A-Z])+\.?/g

/**
 * 本文ブロック（見出し以外）をセンテンスに分割する
 */
function splitBody(text: string): string[] {
  // 略語と頭字語をプレースホルダーに置換してピリオドを保護
  let processed = text
    .replace(ABBREV_PATTERN, (_, abbr) => `${abbr}<DOT>`)
    .replace(ACRONYM_PATTERN, (match) => match.replace(/\./g, '<DOT>'))

  // 数字のピリオド（小数点）を保護
  processed = processed.replace(/(\d)\.(\d)/g, '$1<DECIMAL>$2')

  // センテンス区切りで分割（.!? の後に空白または末尾）
  return processed
    .split(/(?<=[.!?])\s+(?=[A-Z"'])|(?<=[.!?])\s*$/)
    .map((s) =>
      s
        .replace(/<DOT>/g, '.')
        .replace(/<DECIMAL>/g, '.')
        .trim()
    )
    .filter((s) => s.length > 0)
}

/**
 * テキストをセンテンスの配列に分割する
 * markdown の見出し行（# 〜）は独立したセンテンスとして扱う
 */
export function splitSentences(text: string): string[] {
  const lines = text.split(/\r?\n/)
  const result: string[] = []
  let bodyBuf: string[] = []

  // 蓄積した本文をセンテンス分割して結果へ追加する
  const flushBody = () => {
    const body = bodyBuf.join('\n').trim()
    if (body) result.push(...splitBody(body))
    bodyBuf = []
  }

  for (const line of lines) {
    const heading = line.match(/^\s*#{1,6}\s+(.+?)\s*$/)
    if (heading) {
      // 見出しを独立センテンスとして区切る（前後の本文と連結させない）
      flushBody()
      result.push(heading[1].trim())
    } else {
      bodyBuf.push(line)
    }
  }
  flushBody()

  return result
}

/**
 * テキストの単語数をカウントする
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
}