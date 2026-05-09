import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Fira_Code,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Inter,
  JetBrains_Mono,
  Lora,
  Noto_Sans_SC,
  Noto_Serif_SC,
  Source_Code_Pro,
  ZCOOL_XiaoWei,
} from 'next/font/google'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  type TypefaceHighlightedCodeSamples,
  typefaceCandidateCriteria,
  typefaceCandidateSchemes,
  typefaceCodeSamples,
  typefaceFontOptions,
} from '@/lib/dev-typefaces'
import { highlightCodeSnippet } from '@/lib/markdown/code-highlighting'

import { TypefaceLabClient } from './TypefaceLabClient'

export const metadata: Metadata = {
  title: 'Typeface Candidates',
  robots: { index: false, follow: false },
}

const notoSerifSC = Noto_Serif_SC({
  display: 'swap',
  preload: false,
  variable: '--dev-font-noto-serif-sc',
  weight: ['400', '500', '600', '700'],
})

const notoSansSC = Noto_Sans_SC({
  display: 'swap',
  preload: false,
  variable: '--dev-font-noto-sans-sc',
  weight: ['400', '500', '600', '700'],
})

const jetBrainsMono = JetBrains_Mono({
  display: 'swap',
  subsets: ['latin'],
  variable: '--dev-font-jetbrains-mono',
  weight: ['400', '500', '600'],
})

const ibmPlexMono = IBM_Plex_Mono({
  display: 'swap',
  subsets: ['latin'],
  variable: '--dev-font-ibm-plex-mono',
  weight: ['400', '500', '600'],
})

const firaCode = Fira_Code({
  display: 'swap',
  subsets: ['latin'],
  variable: '--dev-font-fira-code',
  weight: ['400', '500', '600'],
})

const sourceCodePro = Source_Code_Pro({
  display: 'swap',
  subsets: ['latin'],
  variable: '--dev-font-source-code-pro',
  weight: ['400', '500', '600'],
})

const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  variable: '--dev-font-inter',
  weight: ['400', '500', '600', '700'],
})

const lora = Lora({
  display: 'swap',
  subsets: ['latin'],
  variable: '--dev-font-lora',
  weight: ['400', '500', '600', '700'],
})

const ibmPlexSans = IBM_Plex_Sans({
  display: 'swap',
  subsets: ['latin'],
  variable: '--dev-font-ibm-plex-sans',
  weight: ['400', '500', '600', '700'],
})

const zcoolXiaoWei = ZCOOL_XiaoWei({
  display: 'swap',
  preload: false,
  variable: '--dev-font-zcool-xiaowei',
  weight: '400',
})

const fontVariables = [
  notoSerifSC.variable,
  notoSansSC.variable,
  jetBrainsMono.variable,
  ibmPlexMono.variable,
  firaCode.variable,
  sourceCodePro.variable,
  inter.variable,
  lora.variable,
  ibmPlexSans.variable,
  zcoolXiaoWei.variable,
].join(' ')

function buildHighlightedCodeSamples(): TypefaceHighlightedCodeSamples {
  return Object.fromEntries(
    typefaceCodeSamples.map((sample) => [
      sample.id,
      highlightCodeSnippet(sample.code, sample.language),
    ]),
  ) as TypefaceHighlightedCodeSamples
}

export default function TypefaceCandidatesPage() {
  const highlightedCodeSamples = buildHighlightedCodeSamples()

  return (
    <div className={`${fontVariables} page-frame frontend-shell dev-reference-shell`}>
      <header className="dev-reference-hero">
        <Link className="editorial-link inline-flex items-center gap-2 text-sm" href="/dev">
          <ArrowLeft aria-hidden="true" /> 开发参考
        </Link>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Typography Lab</Badge>
            <Badge variant="secondary">CJK / Latin / Code</Badge>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
            <div className="flex max-w-4xl flex-col gap-5">
              <h1 className="max-w-4xl font-serif text-5xl leading-none sm:text-6xl">
                中文字体候选方案：先看气质，再决定系统落点。
              </h1>
              <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
                这里集中比较大标题、正文、强调字重、元信息和代码块。候选方案先保持独立，避免在未确认前直接影响真实文章页。
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dev/article-layout">
                对照文章布局 <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <TypefaceLabClient
        criteria={typefaceCandidateCriteria}
        fontOptions={typefaceFontOptions}
        highlightedCodeSamples={highlightedCodeSamples}
        schemes={typefaceCandidateSchemes}
      />
    </div>
  )
}
