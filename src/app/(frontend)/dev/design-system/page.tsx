import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, CircleDot, Sparkles } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Design System Reference',
  robots: { index: false, follow: false },
}

const colorTokens = [
  ['Background', 'bg-background', '页面底色，保持纸张感与阅读稳定性。'],
  ['Foreground', 'bg-foreground', '正文、主标题和高强调信息。'],
  ['Muted', 'bg-muted', '次级区域、静态底板和轻量分隔。'],
  ['Accent', 'bg-accent', '悬停、局部强调和可交互区域反馈。'],
  ['Border', 'bg-border', '结构线、卡片边界和文章节奏切分。'],
] as const

const typeScale = [
  ['Display', 'font-serif text-6xl leading-none tracking-[-0.055em]', '首页 Hero 与专题页主标题'],
  ['Headline', 'font-serif text-4xl leading-tight tracking-[-0.04em]', '文章标题、分区标题'],
  ['Subhead', 'font-serif text-2xl leading-snug tracking-[-0.03em]', '卡片标题、段落组标题'],
  ['Body', 'text-base leading-8 text-foreground/82', '长文正文、说明文字'],
  ['Meta', 'section-kicker', '日期、分类、状态、导航辅助信息'],
] as const

const motionPrinciples = [
  '只为可理解性服务：状态变化、层级进入、阅读位置变化。',
  '偏好 150–240ms 的轻量过渡，长文阅读区域避免持续动画。',
  '交互反馈使用 opacity、background、underline 与轻微位移，不改变排版稳定性。',
]

export default function DesignSystemReferencePage() {
  return (
    <div className="page-frame frontend-shell dev-reference-shell">
      <header className="dev-reference-hero">
        <Link className="editorial-link inline-flex items-center gap-2 text-sm" href="/dev">
          <ArrowLeft aria-hidden="true" /> 开发参考
        </Link>
        <p className="section-kicker">Design System / Frontend</p>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="flex max-w-4xl flex-col gap-5">
            <h1 className="font-serif text-6xl leading-none tracking-[-0.055em] sm:text-7xl lg:text-[5.5rem]">
              安静、清晰、可持续扩展的博客前台语言。
            </h1>
            <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
              本页作为新页面和新组件的视觉起点：先使用语义 token 与现有组件，再通过局部实验页验证复杂交互，最后沉淀为可复用模式。
            </p>
          </div>
          <Card className="dev-reference-card">
            <CardHeader>
              <CardTitle className="font-serif text-2xl tracking-[-0.03em]">原则</CardTitle>
              <CardDescription>以阅读为中心，而不是以装饰为中心。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
              <p>Editorial first</p>
              <p>Semantic tokens</p>
              <p>Composable labs</p>
            </CardContent>
          </Card>
        </div>
      </header>

      <section className="dev-reference-section">
        <div className="dev-reference-section__intro">
          <p className="section-kicker">Tokens</p>
          <h2>色彩语义</h2>
          <p>所有页面优先使用语义色，避免组件内直接绑定具体颜色，使明暗主题和未来品牌调整更安全。</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {colorTokens.map(([label, className, description]) => (
            <Card className="dev-reference-card" key={label}>
              <CardContent className="flex flex-col gap-4 pt-6">
                <div className={`h-24 border border-border ${className}`} />
                <div className="grid gap-1">
                  <h3 className="font-serif text-xl tracking-[-0.03em]">{label}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="dev-reference-section">
        <div className="dev-reference-section__intro">
          <p className="section-kicker">Typography</p>
          <h2>排版层级</h2>
          <p>标题使用展示型衬线字体形成编辑感；正文保持宽松行高，为长文阅读和中英文混排留出呼吸感。</p>
        </div>
        <Card className="dev-reference-card">
          <CardContent className="flex flex-col gap-7 pt-6">
            {typeScale.map(([label, className, usage]) => (
              <div className="grid gap-3 md:grid-cols-[9rem_minmax(0,1fr)] md:items-baseline" key={label}>
                <div className="flex flex-col gap-1">
                  <Badge variant="outline">{label}</Badge>
                  <p className="text-xs leading-5 text-muted-foreground">{usage}</p>
                </div>
                <p className={className}>观测一篇文章如何在时间里慢慢展开</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="dev-reference-section">
        <div className="dev-reference-section__intro">
          <p className="section-kicker">Components</p>
          <h2>控件陈列</h2>
          <p>优先组合 shadcn 基础控件，并由前台 editorial shell 统一调整边角、边框和文本气质。</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="dev-reference-card">
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>主操作、次级操作、文本链接。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button>阅读全文</Button>
              <Button variant="outline">保存草稿</Button>
              <Button variant="ghost">稍后再看</Button>
              <Button variant="link">查看历史</Button>
            </CardContent>
          </Card>

          <Card className="dev-reference-card">
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>状态、分类和实验标记。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Published</Badge>
              <Badge variant="secondary">Draft</Badge>
              <Badge variant="outline">Design Token</Badge>
              <Badge variant="destructive">Breaking</Badge>
            </CardContent>
          </Card>

          <Card className="dev-reference-card">
            <CardHeader>
              <CardTitle>Alert</CardTitle>
              <CardDescription>编辑说明和上下文提示。</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Sparkles aria-hidden="true" />
                <AlertTitle>实验中</AlertTitle>
                <AlertDescription>进入真实页面前，先在 /dev 实验室验证交互边界。</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="dev-reference-section">
        <div className="dev-reference-section__intro">
          <p className="section-kicker">Layout & Motion</p>
          <h2>布局与动效</h2>
          <p>页面采用窄内容宽度、清晰分区和低干扰动效。复杂组件先在实验页里拆解，不直接进入文章页。</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="dev-reference-card">
            <CardHeader>
              <CardTitle className="font-serif text-3xl tracking-[-0.035em]">页面节奏样例</CardTitle>
              <CardDescription>Hero → 内容预览 → 元信息 → 继续阅读。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-4 border border-border bg-muted/28 p-5 md:grid-cols-[minmax(0,1fr)_12rem]">
                <div className="flex flex-col gap-3">
                  <p className="section-kicker">Essay / 12 min</p>
                  <h3 className="font-serif text-4xl leading-tight tracking-[-0.04em]">在长文里保存方向感</h3>
                  <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                    目录和进度提示应该辅助阅读，而不是抢走文章本身的注意力。
                  </p>
                </div>
                <div className="flex items-end justify-end">
                  <Button variant="outline">
                    打开实验 <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="grid gap-3 md:grid-cols-3">
                {motionPrinciples.map((principle) => (
                  <div className="flex gap-3 text-sm leading-6 text-muted-foreground" key={principle}>
                    <CircleDot aria-hidden="true" className="mt-1 shrink-0" />
                    <p>{principle}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="dev-reference-card">
            <CardHeader>
              <BookOpen aria-hidden="true" />
              <CardTitle className="font-serif text-2xl tracking-[-0.03em]">开发约定</CardTitle>
              <CardDescription>新增前台能力时的顺序。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
              <p>1. 先检查 Design System 是否已有模式。</p>
              <p>2. 不确定的交互进入 /dev 实验页。</p>
              <p>3. 稳定后抽成组件并接入真实路由。</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
