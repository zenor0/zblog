export const siteFooterLayoutStyleOptions = [
  {
    description: 'A single compact record for links, copyright, and compliance numbers.',
    label: 'Compact record',
    value: 'compact',
  },
  {
    description: 'A restrained directory with grouped links and compliance metadata below.',
    label: 'Directory',
    value: 'directory',
  },
  {
    description:
      'A legal-first ledger that keeps filings, copyright, and required links prominent.',
    label: 'Compliance ledger',
    value: 'ledger',
  },
] as const

export type SiteFooterLayoutStyle = (typeof siteFooterLayoutStyleOptions)[number]['value']

export const defaultSiteFooterLayoutStyle: SiteFooterLayoutStyle = 'compact'

const siteFooterLayoutStyleValues = new Set<string>(
  siteFooterLayoutStyleOptions.map((option) => option.value),
)

export function resolveSiteFooterLayoutStyle(value: unknown): SiteFooterLayoutStyle {
  return typeof value === 'string' && siteFooterLayoutStyleValues.has(value)
    ? (value as SiteFooterLayoutStyle)
    : defaultSiteFooterLayoutStyle
}
