export type SiteSettingsFormFieldState = {
  rows?: unknown[]
  value?: unknown
}

export type SiteSettingsFormState = Record<string, SiteSettingsFormFieldState | undefined>

const siteSettingsRootKeys = [
  'appearance',
  'siteName',
  'siteDescription',
  'globalVariables',
  'homeHero',
  'seo',
  'articleLayout',
  'footer',
] as const

function isTransientEditorPath(path: string) {
  return path
    .split('.')
    .some((segment) => segment.endsWith('EditorMode') || segment.endsWith('RawConfig'))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneValue(item)]),
    ) as T
  }

  return value
}

function isIndexSegment(value: string) {
  return /^\d+$/.test(value)
}

function setPathValue(target: Record<string, unknown>, path: string, value: unknown) {
  const segments = path.split('.')
  let current: Record<string, unknown> | unknown[] = target

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1
    const key = Array.isArray(current) && isIndexSegment(segment) ? Number(segment) : segment

    if (isLast) {
      current[key as keyof typeof current] = cloneValue(value) as never
      return
    }

    const nextSegment = segments[index + 1] ?? ''
    const nextValue = current[key as keyof typeof current]

    if (!isRecord(nextValue) && !Array.isArray(nextValue)) {
      current[key as keyof typeof current] = (isIndexSegment(nextSegment) ? [] : {}) as never
    }

    current = current[key as keyof typeof current] as Record<string, unknown> | unknown[]
  })
}

function getRootKey(path: string) {
  return path.split('.')[0]
}

function stripTransientEditorState(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripTransientEditorState(item))
  }

  if (!isRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isTransientEditorPath(key))
      .map(([key, item]) => [key, stripTransientEditorState(item)]),
  )
}

function isSiteSettingsRootKey(value: string): value is (typeof siteSettingsRootKeys)[number] {
  return siteSettingsRootKeys.includes(value as (typeof siteSettingsRootKeys)[number])
}

function isPayloadArrayParentState(state: SiteSettingsFormFieldState | undefined) {
  return Array.isArray(state?.rows) && typeof state.value === 'number'
}

function sortByPathDepth(
  [pathA]: [string, SiteSettingsFormFieldState | undefined],
  [pathB]: [string, SiteSettingsFormFieldState | undefined],
) {
  return pathA.split('.').length - pathB.split('.').length
}

export function readSiteSettingsSnapshot<T = Record<string, unknown>>(
  fields: SiteSettingsFormState | undefined,
): T {
  const settings: Record<string, unknown> = {}

  siteSettingsRootKeys.forEach((key) => {
    if (fields?.[key]?.value !== undefined) {
      setPathValue(settings, key, fields[key]?.value)
    }
  })

  Object.entries(fields ?? {})
    .sort(sortByPathDepth)
    .forEach(([path, state]) => {
      const rootKey = getRootKey(path)

      if (!isSiteSettingsRootKey(rootKey)) {
        return
      }

      if (!path.includes('.') || isTransientEditorPath(path)) {
        return
      }

      if (isPayloadArrayParentState(state)) {
        setPathValue(settings, path, [])
        return
      }

      if (state?.value !== undefined) {
        setPathValue(settings, path, state.value)
      }
    })

  return stripTransientEditorState(settings) as T
}
