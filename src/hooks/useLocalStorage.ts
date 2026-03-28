import { useState } from 'react'

/**
 * localStorage と同期した state を提供するカスタムフック
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage が使えない環境（プライベートブラウザ等）では無視
    }
  }

  return [storedValue, setValue] as const
}