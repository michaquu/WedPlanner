export const readStorage = <T>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(key)
    return value === null ? fallback : (JSON.parse(value) as T)
  } catch {
    return fallback
  }
}

export const writeStorage = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be unavailable in private browsing or when its quota is full.
  }
}

export const readStorageText = (key: string, fallback: string) => {
  try {
    return window.localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export const writeStorageText = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage may be unavailable in private browsing or when its quota is full.
  }
}
