import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const pdfPreviewCommand = process.env.ZBLOG_PDF_PREVIEW_COMMAND?.trim() || 'pdftocairo'
const pdfRenderConcurrency = Math.max(
  1,
  Number.parseInt(process.env.ZBLOG_PDF_RENDER_CONCURRENCY?.trim() || '4', 10) || 4,
)

let activePDFRenders = 0
const pendingPDFRenders: Array<() => void> = []

async function withPDFRenderSlot<T>(task: () => Promise<T>): Promise<T> {
  if (activePDFRenders >= pdfRenderConcurrency) {
    await new Promise<void>((resolve) => {
      pendingPDFRenders.push(resolve)
    })
  }

  activePDFRenders += 1

  try {
    return await task()
  } finally {
    activePDFRenders -= 1
    pendingPDFRenders.shift()?.()
  }
}

async function readGeneratedPreviewSVG(outputBase: string, page: number): Promise<null | string> {
  for (const candidate of [outputBase, `${outputBase}.svg`, `${outputBase}-${page}.svg`]) {
    try {
      return await readFile(candidate, 'utf8')
    } catch {
      continue
    }
  }

  return null
}

function escapeXML(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function injectMetadata(args: {
  debugReason?: null | string
  page: number
  sourceURL: string
  svg: string
  watermarkToken?: null | string
}) {
  const metadata = escapeXML(
    JSON.stringify({
      page: args.page,
      renderer: 'zblog-pdf-preview',
      sourceURL: args.sourceURL,
      debugReason: args.debugReason ?? null,
      watermarkToken: args.watermarkToken ?? null,
    }),
  )

  return args.svg.replace(/<svg\b([^>]*)>/i, (match) => `${match}<metadata id="zblog-render-metadata">${metadata}</metadata>`)
}

export function buildPDFPreviewFallbackSVG(args: {
  debugReason?: null | string
  filename?: null | string
  page: number
  sourceURL: string
  watermarkToken?: null | string
}) {
  const filename = escapeXML(args.filename || 'PDF document')
  const pageLabel = escapeXML(`Page ${args.page}`)
  const debugReason = args.debugReason ? escapeXML(args.debugReason) : null
  const showDebugReason = process.env.NODE_ENV !== 'production' && debugReason
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-labelledby="title desc">
  <title id="title">${filename}</title>
  <desc id="desc">Preview placeholder for a PDF document.</desc>
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8f0e7" />
      <stop offset="100%" stop-color="#efe3d6" />
    </linearGradient>
    <linearGradient id="backdrop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f3ebe2" />
      <stop offset="100%" stop-color="#e7d9cb" />
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#backdrop)" />
  <g transform="translate(198 98)">
    <rect x="0" y="0" width="804" height="704" rx="36" fill="url(#paper)" stroke="#c7b4a5" stroke-width="3" />
    <rect x="82" y="100" width="190" height="64" rx="20" fill="#b15c2c" opacity="0.12" />
    <text x="112" y="145" fill="#8a4c26" font-size="42" font-family="Arial, sans-serif" font-weight="700">PDF</text>
    <text x="82" y="250" fill="#251a14" font-size="48" font-family="Arial, sans-serif" font-weight="700">${filename}</text>
    <text x="82" y="318" fill="#695d54" font-size="28" font-family="Arial, sans-serif">${pageLabel}</text>
    <line x1="82" y1="382" x2="722" y2="382" stroke="#d8cabd" stroke-width="12" stroke-linecap="round" />
    <line x1="82" y1="438" x2="662" y2="438" stroke="#dfd2c5" stroke-width="12" stroke-linecap="round" />
    <line x1="82" y1="494" x2="712" y2="494" stroke="#dfd2c5" stroke-width="12" stroke-linecap="round" />
    <line x1="82" y1="550" x2="622" y2="550" stroke="#dfd2c5" stroke-width="12" stroke-linecap="round" />
    ${showDebugReason ? `<text x="82" y="640" fill="#8a4c26" font-size="18" font-family="Arial, sans-serif">Debug: ${debugReason}</text>` : ''}
  </g>
</svg>`

  return injectMetadata({
    debugReason: args.debugReason,
    page: args.page,
    sourceURL: args.sourceURL,
    svg,
    watermarkToken: args.watermarkToken,
  })
}

export async function convertPDFToSVG(args: {
  page: number
  pdfPath: string
  sourceURL: string
  watermarkToken?: null | string
}): Promise<string> {
  return withPDFRenderSlot(async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'zblog-pdf-preview-'))
    const outputBase = path.join(tmpDir, 'preview')

    try {
      await execFileAsync(
        pdfPreviewCommand,
        [
          '-svg',
          '-f',
          String(args.page),
          '-l',
          String(args.page),
          args.pdfPath,
          outputBase,
        ],
        {
          maxBuffer: 16 * 1024 * 1024,
        },
      )

      const svg = await readGeneratedPreviewSVG(outputBase, args.page)

      if (!svg) {
        throw new Error('PDF preview output was not created.')
      }

      return injectMetadata({
        page: args.page,
        sourceURL: args.sourceURL,
        svg,
        watermarkToken: args.watermarkToken,
      })
    } finally {
      await rm(tmpDir, {
        force: true,
        recursive: true,
      })
    }
  })
}

export async function persistPDFPreviewSVG(args: {
  page: number
  pdfPath: string
  previewPath: string
  sourceURL: string
}): Promise<{ error?: null | string; usedFallback: boolean }> {
  try {
    const svg = await convertPDFToSVG(args)

    await mkdir(path.dirname(args.previewPath), {
      recursive: true,
    })
    await writeFile(args.previewPath, svg, 'utf8')

    return {
      error: null,
      usedFallback: false,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown PDF render failure',
      usedFallback: true,
    }
  }
}

export async function renderPDFPreviewSVG(args: {
  debugReason?: null | string
  filename?: null | string
  page: number
  pdfPath: string
  sourceURL: string
  watermarkToken?: null | string
}): Promise<{ error?: null | string; svg: string; usedFallback: boolean }> {
  try {
    return {
      error: null,
      svg: await convertPDFToSVG(args),
      usedFallback: false,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown PDF render failure'

    return {
      error: message,
      svg: buildPDFPreviewFallbackSVG(args),
      usedFallback: true,
    }
  }
}
