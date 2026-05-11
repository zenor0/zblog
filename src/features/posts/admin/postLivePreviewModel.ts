export type PreviewTheme = 'auto' | 'dark' | 'light'

export const previewThemeStorageKey = 'zblog-admin-live-preview-theme'
export const minimumPreviewHeight = 320
export const minimumPreviewWidth = 320
export const zoomOptions = [50, 75, 100, 125, 150, 200]

export function clampDimension(value: number, minimum: number) {
  return Math.max(minimum, Math.round(value))
}

export function getTargetOrigin(url: null | string | undefined) {
  if (typeof url !== 'string' || url.length === 0 || typeof window === 'undefined') {
    return null
  }

  try {
    return new URL(url, window.location.origin).origin
  } catch {
    return null
  }
}

export function isPreviewTheme(value: unknown): value is PreviewTheme {
  return value === 'auto' || value === 'dark' || value === 'light'
}

export function getNumericBreakpointSize(args: {
  breakpoint: string | undefined
  breakpoints:
    | {
        height: number | string
        label: string
        name: string
        width: number | string
      }[]
    | undefined
}) {
  const activeBreakpoint = args.breakpoints?.find((item) => item.name === args.breakpoint)

  return {
    height: typeof activeBreakpoint?.height === 'number' ? activeBreakpoint.height : null,
    width: typeof activeBreakpoint?.width === 'number' ? activeBreakpoint.width : null,
  }
}
