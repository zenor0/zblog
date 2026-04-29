import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, BookMarked, Check, Circle, MapPinned } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Article Progress Lab',
  robots: { index: false, follow: false },
}

const sections = [
  { id: 'opening', label: '开篇', progress: 12, state: 'done' },
  { id: 'context', label: '背景', progress: 28, state: 'done' },
  { id: 'argument', label: '主论点', progress: 54, state: 'current' },
  { id: 'references', label: '引用', progress: 76, state: 'upcoming' },
  { id: 'ending', label: '结语', progress: 100, state: 'upcoming' },
] as const

const paragraphBlocks = [
  '这是一页用于隔离开发文章阅读辅助控件的实验场。它不依赖真实文章数据，可以先验证目录、进度条、章节状态、滚动提示和窄屏布局。',
  '真实文章页最重要的是阅读连续性，因此任何浮动控件都应该保持克制：展示当前位置、帮助跳转，但不制造额外视觉负担。',
  '后续可以把本页拆成多个更小的实验：移动端底部进度条、桌面端侧边目录、代码块内小地图、引用段落定位，以及阅读完成后的推荐入口。',
]

export default function ArticleProgressLabPage() {
  return (
    <div className="page-frame frontend-shell dev-reference-shell">
      <header className="dev-reference-hero">
        <Link className="editorial-link inline-flex items-center gap-2 text-sm" href="/dev">
          <ArrowLeft aria-hidden="true" /> 开发参考
        </Link>
        <p className="section-kicker">Component Lab / Article Progress</p>
        <div className="flex max-w-4xl flex-col gap-5">
          <h1 className="font-serif text-6xl leading-none tracking-[-0.055em] sm:text-7xl">
            单独验证文章进度和目录，不污染真实文章流程。
          </h1>
          <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
            这里用于沉淀阅读辅助组件的交互假设。确认方向后，再把稳定逻辑抽到前台组件并接入文章详情页。
          </p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <article className="article-copy min-w-0 border border-border bg-background px-5 py-8 sm:px-8 lg:px-10">
          <p className="section-kicker">Preview Article</p>
          <h2 id="opening">在长文里保持方向感</h2>
          {paragraphBlocks.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h3 id="context">背景：为什么需要实验页</h3>
          <p>
            当文章页同时包含正文、目录、媒体、引用和历史版本时，直接在真实页面里试错会让反馈变慢。实验页把变量缩小到单个组件，让设计和实现可以快速迭代。
          </p>

          <h3 id="argument">当前假设：低干扰、可定位、可替换</h3>
          <p>
            当前阶段的目标不是一次性定稿，而是先定义清楚可替换的边界：数据输入、显示状态、桌面与移动端布局，以及与文章正文之间的视觉层级。
          </p>

          <h3 id="references">引用和复杂内容</h3>
          <p>
            目录组件需要兼容二级、三级标题，并在引用、表格、代码块和媒体穿插出现时仍然准确表达阅读位置。
          </p>

          <h3 id="ending">完成态</h3>
          <p>
            阅读完成后可以弱提示相关文章、返回顶部或收藏入口，但默认不打断阅读结束时的停顿。
          </p>
        </article>

        <aside className="dev-progress-panel">
          <Card className="dev-reference-card">
            <CardHeader>
              <MapPinned aria-hidden="true" />
              <CardTitle className="font-serif text-2xl tracking-[-0.03em]">阅读位置</CardTitle>
              <CardDescription>模拟 54% 进度，当前停留在“主论点”。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div aria-label="文章阅读进度" className="h-2 border border-border bg-muted/50" role="progressbar" aria-valuemax={100} aria-valuemin={0} aria-valuenow={54}>
                <div className="h-full bg-foreground" style={{ width: '54%' }} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-4xl tracking-[-0.04em]">54%</span>
                <Badge variant="secondary">主论点</Badge>
              </div>
              <Separator />
              <nav aria-label="文章目录实验" className="flex flex-col gap-1">
                {sections.map((section) => (
                  <a
                    className="dev-progress-link"
                    data-state={section.state}
                    href={`#${section.id}`}
                    key={section.id}
                  >
                    {section.state === 'done' ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}
                    <span>{section.label}</span>
                    <span>{section.progress}%</span>
                  </a>
                ))}
              </nav>
            </CardContent>
          </Card>

          <Card className="dev-reference-card">
            <CardHeader>
              <BookMarked aria-hidden="true" />
              <CardTitle className="font-serif text-2xl tracking-[-0.03em]">待验证问题</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
              <p>桌面目录是否 sticky，还是只在文章顶部显示？</p>
              <p>移动端使用顶部细进度条，还是底部章节抽屉？</p>
              <p>标题层级很多时，是否需要折叠三级标题？</p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  )
}
