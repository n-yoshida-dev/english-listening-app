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
 * テキストをセンテンスの配列に分割する
 */
export function splitSentences(text: string): string[] {
  // 略語と頭字語をプレースホルダーに置換してピリオドを保護
  let processed = text
    .replace(ABBREV_PATTERN, (_, abbr) => `${abbr}<DOT>`)
    .replace(ACRONYM_PATTERN, (match) => match.replace(/\./g, '<DOT>'))

  // 数字のピリオド（小数点）を保護
  processed = processed.replace(/(\d)\.(\d)/g, '$1<DECIMAL>$2')

  // センテンス区切りで分割（.!? の後に空白または末尾）
  const sentences = processed
    .split(/(?<=[.!?])\s+(?=[A-Z"'])|(?<=[.!?])\s*$/)
    .map((s) =>
      s
        .replace(/<DOT>/g, '.')
        .replace(/<DECIMAL>/g, '.')
        .trim()
    )
    .filter((s) => s.length > 0)

  return sentences
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