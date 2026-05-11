import type { SiteFooterLayoutStyle } from '@/features/site-settings/model/site-footer'

export const footerLayoutCandidates = [
  {
    description: '最接近常见个人博客：站点名、低频链接、版权和备案信息集中在一小块区域。',
    layoutStyle: 'compact',
    title: '方案 A：紧凑记录型',
  },
  {
    description: '保留分组链接，但整体弱化品牌展示，适合链接数量略多的博客。',
    layoutStyle: 'directory',
    title: '方案 B：目录型',
  },
  {
    description: '优先露出版权、备案号和法律链接，适合需要合规信息非常清楚的站点。',
    layoutStyle: 'ledger',
    title: '方案 C：备案信息型',
  },
  {
    description:
      '结合目录顶栏和三层结构：上方导航，中间放站主联系方式与社交账号，下方左右平衡地放备案、法律与版权信息。',
    layoutStyle: 'balanced',
    title: '方案 D：平衡目录型',
  },
] satisfies {
  description: string
  layoutStyle: SiteFooterLayoutStyle
  title: string
}[]
