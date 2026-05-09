import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { IBM_Plex_Mono, JetBrains_Mono, Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google'
import { ArrowLeft, ArrowRight, Braces, CaseSensitive, ListChecks, Type } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type TypefaceCandidateScheme,
  typefaceCandidateCriteria,
  typefaceCandidateSchemes,
} from '@/lib/dev-typefaces'

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

type TypefaceStyle = CSSProperties & Record<`--typeface-${string}`, number | string>

function getTypefaceStyle(scheme: TypefaceCandidateScheme): TypefaceStyle {
  return {
    '--typeface-body-font': scheme.fonts.body,
    '--typeface-body-line-height': scheme.scale.bodyLineHeight,
    '--typeface-body-size': scheme.scale.body,
    '--typeface-body-weight': scheme.weights.body,
    '--typeface-code-font': scheme.fonts.code,
    '--typeface-code-size': scheme.scale.code,
    '--typeface-code-weight': scheme.weights.code,
    '--typeface-display-font': scheme.fonts.display,
    '--typeface-display-line-height': scheme.scale.displayLineHeight,
    '--typeface-display-size': scheme.scale.display,
    '--typeface-display-size-small': scheme.scale.displaySmall,
    '--typeface-display-weight': scheme.weights.display,
    '--typeface-heading-font': scheme.fonts.heading,
    '--typeface-heading-line-height': scheme.scale.headingLineHeight,
    '--typeface-heading-size': scheme.scale.heading,
    '--typeface-heading-weight': scheme.weights.heading,
    '--typeface-meta-font': scheme.fonts.ui,
    '--typeface-meta-weight': scheme.weights.meta,
    '--typeface-strong-weight': scheme.weights.strong,
  }
}

const fontVariables = [
  notoSerifSC.variable,
  notoSansSC.variable,
  jetBrainsMono.variable,
  ibmPlexMono.variable,
].join(' ')

export default function TypefaceCandidatesPage() {
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

      <section className="dev-reference-section">
        <div className="dev-reference-section__intro">
          <p className="section-kicker">Evaluation</p>
          <h2>判断标准</h2>
          <p>
            这些点直接对应当前字体问题：中文不够优雅、强调层级不明显、字号和代码字体缺少统一判断。
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {typefaceCandidateCriteria.map((criterion, index) => (
            <Card className="dev-reference-card" key={criterion}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Badge variant="outline">{String(index + 1).padStart(2, '0')}</Badge>
                  <CardTitle className="text-base leading-6">{criterion}</CardTitle>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="dev-reference-section">
        <div className="dev-reference-section__intro">
          <p className="section-kicker">Candidates</p>
          <h2>四组候选</h2>
          <p>每组都显示同一类内容：中文大标题、中文正文、西文混排、强调字重、内联代码和代码块。</p>
        </div>
        <div className="grid gap-5">
          {typefaceCandidateSchemes.map((scheme, index) => (
            <Card
              className="dev-reference-card dev-typeface-scheme"
              data-typeface-scheme={scheme.id}
              key={scheme.id}
              style={getTypefaceStyle(scheme)}
            >
              <CardHeader className="gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">方案 {String(index + 1).padStart(2, '0')}</Badge>
                      {scheme.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="dev-typeface-scheme__name">{scheme.title}</CardTitle>
                  </div>
                  <div className="dev-typeface-scheme__weights" aria-label="字重层级">
                    <span>Body {scheme.weights.body}</span>
                    <span>Strong {scheme.weights.strong}</span>
                    <span>Heading {scheme.weights.heading}</span>
                  </div>
                </div>
                <CardDescription className="max-w-3xl leading-7">
                  {scheme.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="dev-typeface-scheme__spec-grid">
                  <div>
                    <Type aria-hidden="true" />
                    <p>标题</p>
                    <span>{scheme.fonts.heading}</span>
                  </div>
                  <div>
                    <CaseSensitive aria-hidden="true" />
                    <p>正文</p>
                    <span>{scheme.fonts.body}</span>
                  </div>
                  <div>
                    <Braces aria-hidden="true" />
                    <p>代码</p>
                    <span>{scheme.fonts.code}</span>
                  </div>
                </div>

                <div className="dev-typeface-scheme__preview">
                  <div className="dev-typeface-scheme__article-sample">
                    <p className="dev-typeface-scheme__label">Title Sample</p>
                    <h2 className="dev-typeface-scheme__display">{scheme.samples.title}</h2>
                    <h3 className="dev-typeface-scheme__heading">{scheme.samples.heading}</h3>
                    <div className="dev-typeface-scheme__body">
                      <p>{scheme.samples.body}</p>
                      <p>
                        普通正文保持稳定，<strong>需要强调的状态、结论和引用说明</strong>
                        必须从 400 字重中跳出来；内联代码 <code>font-weight</code>{' '}
                        也要清楚但不刺眼。
                      </p>
                    </div>
                  </div>

                  <div className="dev-typeface-scheme__code-sample">
                    <p className="dev-typeface-scheme__label">Code Sample</p>
                    <pre>{scheme.samples.code}</pre>
                    <div className="dev-typeface-scheme__rationale">
                      <ListChecks aria-hidden="true" />
                      <p>{scheme.rationale}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
