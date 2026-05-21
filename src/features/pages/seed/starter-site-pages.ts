import type { AppLocale } from '@/shared/i18n/locales'

export type StarterSitePageCopy = {
  content: string
  description: string
  effectiveDateLabel?: string
  eyebrow: string
  metaDescription: string
  title: string
}

export type StarterSitePage = {
  locales: Record<AppLocale, StarterSitePageCopy>
  slug: string
}

export const starterSitePages: StarterSitePage[] = [
  {
    locales: {
      en: {
        content: [
          '## What this site is for',
          '',
          'ZBlog is a bilingual writing space for technical notes, product thinking, and durable references from everyday work.',
          '',
          'The site is intentionally small: published posts remain the primary surface, while this page records the context behind the writing.',
          '',
          '## Editorial approach',
          '',
          'Most articles are written as working notes first, then refined into references that can be revisited later.',
          '',
          'When a post is translated or machine-assisted, the article page marks that status so readers can judge the source context.',
        ].join('\n'),
        description:
          'A concise note about the site, the writing scope, and how readers can understand this blog.',
        eyebrow: 'Site',
        metaDescription: 'About this bilingual blog and its editorial scope.',
        title: 'About',
      },
      'zh-Hans': {
        content: [
          '## 这个站点用来做什么',
          '',
          'ZBlog 是一个双语写作空间，用来沉淀技术笔记、产品思考，以及日常工作中值得长期引用的资料。',
          '',
          '站点保持轻量：已发布文章是主要内容入口，这个页面只补充说明写作背景。',
          '',
          '## 内容方式',
          '',
          '多数文章会先作为工作笔记写下，再整理成以后可以回看的参考内容。',
          '',
          '如果文章经过翻译或机器辅助生成，文章页会标注对应状态，方便读者判断内容来源。',
        ].join('\n'),
        description: '这里简要说明本站的定位、写作范围，以及读者可以如何理解这个博客。',
        eyebrow: '站点',
        metaDescription: '关于这个双语博客及其内容范围。',
        title: '关于',
      },
    },
    slug: 'about',
  },
  {
    locales: {
      en: {
        content: [
          '## Information we may process',
          '',
          'This site is primarily a public content site. It may process technical request data such as IP-derived request metadata, browser information, timestamps, and pages requested so the service can be delivered and protected.',
          '',
          'If you contact the site owner, the information you choose to provide may be used to respond to that message.',
          '',
          '## How information is used',
          '',
          'Information is used to operate the site, maintain security, understand basic site health, and improve published content.',
          '',
          'This template policy should be reviewed and adjusted before the site is used for a business, newsletter, account system, analytics program, or paid service.',
          '',
          '## Third-party services',
          '',
          'The site may link to third-party services, repositories, documentation, or embedded resources. Those services are governed by their own policies.',
          '',
          'If cookies, analytics, comments, payments, or accounts are enabled later, this page should be updated before those features are launched.',
        ].join('\n'),
        description:
          'This policy describes the basic information practices for this site and can be replaced with formal legal copy when needed.',
        effectiveDateLabel: 'Effective date: 2026-05-16',
        eyebrow: 'Legal',
        metaDescription: 'Privacy policy for ZBlog.',
        title: 'Privacy Policy',
      },
      'zh-Hans': {
        content: [
          '## 我们可能处理的信息',
          '',
          '本站主要是公开内容站点。为提供和保护服务，站点可能处理请求相关的技术信息，例如由 IP 派生的请求元数据、浏览器信息、访问时间和请求页面。',
          '',
          '如果你主动联系站点所有者，你提供的信息可能会被用于回复该消息。',
          '',
          '## 信息如何使用',
          '',
          '这些信息用于运行站点、维护安全、了解基础服务状态，以及改进已发布内容。',
          '',
          '如果本站后续用于商业服务、邮件订阅、账号系统、统计分析或付费功能，应先审查并更新这份模板政策。',
          '',
          '## 第三方服务',
          '',
          '本站可能链接到第三方服务、代码仓库、文档或嵌入资源。这些服务适用其各自的政策。',
          '',
          '如果后续启用 Cookie、分析、评论、支付或账号功能，应在上线前同步更新本页面。',
        ].join('\n'),
        description: '本政策说明本站的基础信息处理方式。正式上线前可替换为经过确认的法律文本。',
        effectiveDateLabel: '生效日期：2026-05-16',
        eyebrow: '法律',
        metaDescription: 'ZBlog 的隐私政策。',
        title: '隐私政策',
      },
    },
    slug: 'privacy',
  },
  {
    locales: {
      en: {
        content: [
          '## Use of the site',
          '',
          'By using this site, you agree to access it lawfully and avoid disrupting its operation or attempting to access private administrative surfaces.',
          '',
          'Content is provided for general informational purposes and may change without notice.',
          '',
          '## Content and rights',
          '',
          'Unless otherwise stated, articles and site materials belong to their respective authors or rights holders.',
          '',
          'Short references with attribution are welcome, but copying substantial portions of the site should require permission from the owner.',
          '',
          '## External links and changes',
          '',
          'External links are provided as references. The site owner is not responsible for the content, availability, or policies of third-party destinations.',
          '',
          'These template terms should be reviewed and adjusted before the site is used for commercial services, user accounts, paid products, or community features.',
        ].join('\n'),
        description:
          'These terms provide a simple baseline for using this site and can be replaced with formal legal copy when needed.',
        effectiveDateLabel: 'Effective date: 2026-05-16',
        eyebrow: 'Legal',
        metaDescription: 'Terms of use for ZBlog.',
        title: 'Terms of Use',
      },
      'zh-Hans': {
        content: [
          '## 使用本站',
          '',
          '访问本站即表示你同意以合法方式使用本站，不干扰其运行，也不尝试访问非公开的管理界面。',
          '',
          '站点内容仅用于一般信息参考，可能会不定期调整。',
          '',
          '## 内容与权利',
          '',
          '除非另有说明，文章和站点材料归对应作者或权利人所有。',
          '',
          '带署名的短引用通常是可以接受的，但复制本站大段内容前应获得所有者许可。',
          '',
          '## 外部链接与变更',
          '',
          '外部链接仅作为参考提供。站点所有者不对第三方目标的内容、可用性或政策负责。',
          '',
          '如果本站后续用于商业服务、用户账号、付费产品或社区功能，应先审查并更新这份模板条款。',
        ].join('\n'),
        description: '这些条款提供使用本站的基础说明。正式上线前可替换为经过确认的法律文本。',
        effectiveDateLabel: '生效日期：2026-05-16',
        eyebrow: '法律',
        metaDescription: 'ZBlog 的用户协议。',
        title: '用户协议',
      },
    },
    slug: 'terms',
  },
]
