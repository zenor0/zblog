export type TypefaceCandidateID =
  | 'hybrid-magazine'
  | 'serif-editorial'
  | 'system-songti'
  | 'technical-journal'

export type TypefaceCandidateScheme = {
  description: string
  fonts: {
    body: string
    code: string
    display: string
    heading: string
    ui: string
  }
  id: TypefaceCandidateID
  rationale: string
  samples: {
    body: string
    code: string
    heading: string
    title: string
  }
  scale: {
    body: string
    bodyLineHeight: string
    code: string
    display: string
    displayLineHeight: string
    displaySmall: string
    heading: string
    headingLineHeight: string
  }
  tags: string[]
  title: string
  weights: {
    body: number
    code: number
    display: number
    heading: number
    meta: number
    strong: number
  }
}

const notoSerifSCStack =
  'var(--dev-font-noto-serif-sc), "Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", SimSun, serif'

const notoSansSCStack =
  'var(--dev-font-noto-sans-sc), "Source Han Sans SC", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif'

const systemSongtiStack =
  '"Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", STSong, SimSun, serif'

const systemHeitiStack =
  '"Source Han Sans SC", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif'

export const typefaceCandidateSchemes: TypefaceCandidateScheme[] = [
  {
    description: '中文标题和正文都使用宋体骨架，西文标题保留 Newsreader 的编辑感。',
    fonts: {
      body: notoSerifSCStack,
      code: 'var(--dev-font-jetbrains-mono), "SFMono-Regular", Consolas, "Liberation Mono", monospace',
      display: `var(--font-serif-display), ${notoSerifSCStack}`,
      heading: `var(--font-serif-display), ${notoSerifSCStack}`,
      ui: `var(--font-sans-ui), ${notoSansSCStack}`,
    },
    id: 'serif-editorial',
    rationale:
      '适合文章页和首页大标题。中文信息有更强的书卷气，正文会更慢、更稳；需要用更明显的 strong 字重避免重点被冲淡。',
    samples: {
      body: '当一个段落同时包含中文叙述、English terms 和少量技术词汇时，宋体正文会让阅读节奏更像长文，而不是后台说明。重点信息需要用更高字重拉开，例如发布状态、引用说明、版本差异。',
      code: "export function resolveTone(locale: 'zh-Hans' | 'en') {\n  return locale === 'zh-Hans' ? 'editorial' : 'measured'\n}",
      heading: '标题层级需要在尺寸之外依靠字重建立秩序',
      title: '文章在时间里展开，字体也应当留下停顿。',
    },
    scale: {
      body: '1.0625rem',
      bodyLineHeight: '1.9',
      code: '0.875rem',
      display: '4.75rem',
      displayLineHeight: '1.05',
      displaySmall: '3rem',
      heading: '2rem',
      headingLineHeight: '1.22',
    },
    tags: ['full serif', 'longform', 'editorial'],
    title: 'Serif Editorial',
    weights: {
      body: 400,
      code: 400,
      display: 600,
      heading: 600,
      meta: 600,
      strong: 700,
    },
  },
  {
    description: '中文大标题使用宋体，正文和界面保留黑体，重点通过 600 字重明确拉开。',
    fonts: {
      body: notoSansSCStack,
      code: 'var(--dev-font-ibm-plex-mono), "SFMono-Regular", Consolas, "Liberation Mono", monospace',
      display: `var(--font-serif-display), ${notoSerifSCStack}`,
      heading: `var(--font-serif-display), ${notoSerifSCStack}`,
      ui: `var(--font-sans-ui), ${notoSansSCStack}`,
    },
    id: 'hybrid-magazine',
    rationale:
      '适合需要兼顾文章气质和产品界面清晰度的页面。标题有编辑感，正文仍然利于快速扫描，代码块用 IBM Plex Mono 保持紧凑。',
    samples: {
      body: '这种组合让首页、列表页和文章页可以共用一套语气：标题更有性格，正文仍然易读。强调文字使用 600，元信息使用 500 到 600，普通正文保持 400。',
      code: 'export function getEmphasisWeight(role: string) {\n  return role === "strong" ? 600 : 400\n}',
      heading: '混排页面需要在优雅和可扫读之间保持平衡',
      title: '用宋体处理气质，用黑体处理速度。',
    },
    scale: {
      body: '1.02rem',
      bodyLineHeight: '1.78',
      code: '0.86rem',
      display: '4.5rem',
      displayLineHeight: '1.06',
      displaySmall: '2.875rem',
      heading: '1.875rem',
      headingLineHeight: '1.25',
    },
    tags: ['serif title', 'sans body', 'balanced'],
    title: 'Hybrid Magazine',
    weights: {
      body: 400,
      code: 400,
      display: 600,
      heading: 600,
      meta: 600,
      strong: 600,
    },
  },
  {
    description: '优先使用系统宋体栈，减少额外 Web Font 依赖，观察真实设备上的中文衬线表现。',
    fonts: {
      body: systemSongtiStack,
      code: '"SFMono-Regular", ui-monospace, Menlo, Consolas, "Liberation Mono", monospace',
      display: `var(--font-serif-display), ${systemSongtiStack}`,
      heading: `var(--font-serif-display), ${systemSongtiStack}`,
      ui: `var(--font-sans-ui), ${systemHeitiStack}`,
    },
    id: 'system-songti',
    rationale:
      '适合作为低依赖基线。macOS 上会更接近传统宋体，Linux/Windows 取决于本机字体；优点是加载轻，风险是跨平台一致性较弱。',
    samples: {
      body: '如果不希望引入大型中文字库，可以先用系统宋体栈测试整体气质。这个方案的关键不是追求完全一致，而是确认衬线中文在页面结构里的方向是否正确。',
      code: "export function getLoadingCost(font: 'system' | 'webfont') {\n  return font === 'system' ? 'low' : 'measured'\n}",
      heading: '系统宋体可以验证方向，但不能保证每台设备一致',
      title: '把字体选择先交给设备，再观察是否足够稳定。',
    },
    scale: {
      body: '1.05rem',
      bodyLineHeight: '1.86',
      code: '0.875rem',
      display: '4.35rem',
      displayLineHeight: '1.08',
      displaySmall: '2.75rem',
      heading: '1.95rem',
      headingLineHeight: '1.28',
    },
    tags: ['system stack', 'low dependency', 'baseline'],
    title: 'System Songti',
    weights: {
      body: 400,
      code: 400,
      display: 600,
      heading: 600,
      meta: 600,
      strong: 700,
    },
  },
  {
    description: '中文标题使用较克制的宋体，正文为黑体，代码字体和字号优先照顾技术文章。',
    fonts: {
      body: notoSansSCStack,
      code: 'var(--dev-font-jetbrains-mono), "SFMono-Regular", Consolas, "Liberation Mono", monospace',
      display: `var(--font-serif-display), ${notoSerifSCStack}`,
      heading: `var(--font-serif-display), ${notoSerifSCStack}`,
      ui: `var(--font-sans-ui), ${notoSansSCStack}`,
    },
    id: 'technical-journal',
    rationale:
      '适合技术笔记、变更历史和含代码量高的文章。标题不抢正文，代码块字面更清楚；强调字重需要明显高于正文。',
    samples: {
      body: '技术内容通常需要频繁切换段落、列表、内联代码和代码块。这里让正文保持黑体的稳定性，标题只用较轻的宋体气质，不把页面推得太文学化。',
      code: "export function pickFont(role: 'body' | 'code') {\n  return role === 'code' ? 'JetBrains Mono' : 'Noto Sans SC'\n}",
      heading: '代码块和正文之间应该有明确材质差异',
      title: '技术文章也可以有编辑感，但不牺牲扫描效率。',
    },
    scale: {
      body: '1rem',
      bodyLineHeight: '1.72',
      code: '0.9rem',
      display: '4.15rem',
      displayLineHeight: '1.08',
      displaySmall: '2.625rem',
      heading: '1.75rem',
      headingLineHeight: '1.3',
    },
    tags: ['technical', 'code first', 'measured'],
    title: 'Technical Journal',
    weights: {
      body: 400,
      code: 400,
      display: 600,
      heading: 600,
      meta: 600,
      strong: 700,
    },
  },
]

export const typefaceCandidateCriteria = [
  '中文大标题是否足够优雅，并且不依赖负字距制造精致感。',
  '正文、强调、元信息和标题是否有清楚的字重层级。',
  '西文和中文混排时，x-height、行高和标点节奏是否稳定。',
  '代码块是否能和正文拉开材质差异，同时保持紧凑可读。',
] as const
