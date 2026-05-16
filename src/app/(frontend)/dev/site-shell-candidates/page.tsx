import type { Metadata } from 'next'
import Link from 'next/link'
import { LanguagesIcon, SunMoonIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { seedProjectCopy, seedProjectSlugs } from '@/features/projects/seed/seed-project-content'

type ActiveSection = 'about' | 'posts' | 'projects'

type HeaderTaglineMode = 'hidden' | 'inline' | 'stacked'

type CandidateID = 'editorial-index' | 'editorial-inline-slogan' | 'editorial-stacked-slogan'

type Candidate = {
  description: string
  headerTaglineMode: HeaderTaglineMode
  id: CandidateID
  projectLayout: string
  title: string
}

const candidates: Candidate[] = [
  {
    description:
      '默认收敛方案：单行 editorial bar，保留清楚的 active underline，项目区使用紧凑的 Project Index。',
    headerTaglineMode: 'hidden',
    id: 'editorial-index',
    projectLayout: 'Project Index / no slogan',
    title: 'Editorial Bar + Project Index',
  },
  {
    description:
      '把 slogan 作为可选配置放进同一行，适合站点名需要补充语义、但仍希望 header 保持轻的时候。',
    headerTaglineMode: 'inline',
    id: 'editorial-inline-slogan',
    projectLayout: 'Project Index / inline slogan',
    title: 'Editorial Bar + Inline Slogan',
  },
  {
    description:
      '保留双行 slogan 的可能性，但只在品牌区域内部换行，整体 header 仍然尽量不增加导航层级。',
    headerTaglineMode: 'stacked',
    id: 'editorial-stacked-slogan',
    projectLayout: 'Project Index / two-line slogan',
    title: 'Editorial Bar + Two-line Slogan',
  },
]

const navItems: Array<{ id: ActiveSection; label: string }> = [
  {
    id: 'posts',
    label: '文章',
  },
  {
    id: 'projects',
    label: '项目',
  },
  {
    id: 'about',
    label: '关于',
  },
]

const projects = seedProjectSlugs.map((slug) => ({
  copy: seedProjectCopy[slug]['zh-Hans'],
  slug,
  status: slug === 'zblog-project-system' ? '进行中' : '已发布',
  timeframe: '2026',
}))

const headerTagline = '技术、产品与日常工作'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Site Shell Candidates',
}

function CandidateHeader(props: {
  active: ActiveSection
  compact?: boolean
  taglineMode: HeaderTaglineMode
}) {
  const { active, compact = false, taglineMode } = props

  return (
    <header
      className="site-shell-candidate-header"
      data-candidate-header="editorial-bar"
      data-compact={compact ? 'true' : 'false'}
      data-header-tagline-mode={taglineMode}
    >
      <Link className="site-shell-candidate-header__brand" href="#site-shell-candidates">
        <span className="site-shell-candidate-header__brand-name">ZBlog</span>
        {taglineMode !== 'hidden' ? (
          <span className="site-shell-candidate-header__tagline">{headerTagline}</span>
        ) : null}
      </Link>
      <nav aria-label="候选导航" className="site-shell-candidate-header__nav">
        {navItems.map((item) => (
          <Link
            aria-current={item.id === active ? 'page' : undefined}
            className="site-shell-candidate-header__link"
            data-active={item.id === active ? 'true' : 'false'}
            href="#site-shell-candidates"
            key={item.id}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="site-shell-candidate-header__tools" aria-label="候选工具" role="group">
        <Button
          aria-label="主题"
          className="site-shell-candidate-header__tool border border-border"
          data-header-tool="theme"
          size="icon-sm"
          title="主题"
          type="button"
          variant="ghost"
        >
          <SunMoonIcon data-icon="inline-start" />
        </Button>
        <Button
          aria-label="语言"
          className="site-shell-candidate-header__tool border border-border"
          data-header-tool="locale"
          size="icon-sm"
          title="语言"
          type="button"
          variant="ghost"
        >
          <LanguagesIcon data-icon="inline-start" />
        </Button>
      </div>
    </header>
  )
}

function ActiveStateStrip(props: { taglineMode: HeaderTaglineMode }) {
  return (
    <div className="site-shell-active-strip">
      {(['posts', 'projects', 'about'] as ActiveSection[]).map((active) => (
        <CandidateHeader active={active} compact key={active} taglineMode={props.taglineMode} />
      ))}
    </div>
  )
}

function ProjectIndex() {
  return (
    <section className="site-shell-project-index" data-shell-project-index="">
      <div className="site-shell-project-section-header">
        <p className="section-kicker">项目</p>
        <h3>持续工作</h3>
      </div>
      {projects.map((project) => (
        <article className="site-shell-project-index__item" key={project.slug}>
          <div>
            <h4>{project.copy.title}</h4>
            <p>{project.copy.summary}</p>
          </div>
          <div className="site-shell-project-index__aside">
            <span>{project.status}</span>
            <span>{project.timeframe}</span>
          </div>
        </article>
      ))}
    </section>
  )
}

function CandidatePreview(props: { candidate: Candidate; compact?: boolean }) {
  const { candidate, compact = false } = props

  return (
    <div className="site-shell-preview" data-preview-size={compact ? 'mobile' : 'desktop'}>
      <CandidateHeader
        active="projects"
        compact={compact}
        taglineMode={candidate.headerTaglineMode}
      />
      <main className="site-shell-preview__body">
        <section className="site-shell-preview__hero">
          <p className="section-kicker">个人博客</p>
          <h3>记录技术、产品与日常思考</h3>
          <p>这里会持续发布文章、笔记和项目更新。</p>
        </section>
        <ProjectIndex />
      </main>
    </div>
  )
}

export default function SiteShellCandidatesPage() {
  return (
    <div className="page-frame frontend-shell site-shell-candidates" data-site-shell-candidates="">
      <header className="dev-reference-hero">
        <p className="section-kicker">Site Shell Candidates</p>
        <div className="flex max-w-4xl flex-col gap-5">
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">
            Editorial Bar 与 Project Index 收敛方案
          </h1>
          <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
            保留你偏好的 editorial 顶部栏和项目索引排版，并对比 slogan
            的隐藏、单行、双行配置。主题和语言入口回到当前站点的图标按钮形态。
          </p>
        </div>
      </header>

      <div className="grid gap-10">
        {candidates.map((candidate) => (
          <section
            className="site-shell-candidate"
            data-shell-candidate={candidate.id}
            key={candidate.id}
          >
            <div className="site-shell-candidate__intro">
              <p className="section-kicker">{candidate.projectLayout}</p>
              <div>
                <h2>{candidate.title}</h2>
                <p>{candidate.description}</p>
              </div>
            </div>

            <ActiveStateStrip taglineMode={candidate.headerTaglineMode} />

            <div className="site-shell-candidate__previews">
              <CandidatePreview candidate={candidate} />
              <CandidatePreview candidate={candidate} compact />
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
