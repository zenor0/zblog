function isSqliteBusy(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  if (error.message.includes('database is locked') || error.message.includes('SQLITE_BUSY')) {
    return true
  }

  const errorWithCause = error as Error & {
    cause?: unknown
    code?: string
  }

  if (errorWithCause.code === 'SQLITE_BUSY') {
    return true
  }

  return isSqliteBusy(errorWithCause.cause)
}

export async function retryOnSqliteBusy<T>(
  operation: () => Promise<T>,
  options?: {
    attempts?: number
    delayMs?: number
  },
): Promise<T> {
  const attempts = options?.attempts ?? 20
  const delayMs = options?.delayMs ?? 500

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      if (!isSqliteBusy(error) || attempt === attempts) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
    }
  }

  throw new Error('retryOnSqliteBusy exhausted without returning or throwing')
}
