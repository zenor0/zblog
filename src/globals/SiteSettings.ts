import type { Field, GlobalConfig } from 'payload'

import {
  articleDesignAdvancedControlConfigs,
  articleDesignCJKFontOptions,
  articleDesignCodeFontOptions,
  articleDesignHeadingFontOptions,
  articleDesignLatinFontOptions,
  articleDesignPresetOptions,
  defaultArticleDesignPresetID,
  validateArticleDesignLength,
  validateArticleDesignLineHeight,
} from '@/features/article/model/article-design'
import {
  validateCustomVariableKey,
  validateSiteSettingReferences,
} from '@/features/site-settings/model/site-settings-config'
import {
  defaultSiteFooterLayoutStyle,
  siteFooterLayoutStyleOptions,
} from '@/features/site-settings/model/site-footer-layout'
import { anyone, editorOnly } from '@/shared/auth/access'
import { defaultSiteName } from '@/shared/site/defaults'

const localizedHeroDefaults = {
  en: {
    description: 'A simple blog for articles, notes, and project updates.',
    eyebrow: 'Personal Blog',
    siteDescription: 'A bilingual blog about tech, products, and everyday work.',
    title: 'Notes on tech, products, and everyday work',
  },
  'zh-Hans': {
    description: '这里会持续发布文章、笔记和项目更新。',
    eyebrow: '个人博客',
    siteDescription: '一个持续记录技术、产品与日常工作的双语博客。',
    title: '记录技术、产品与日常思考',
  },
} as const

function getLocalizedHeroDefault(
  locale: null | string | undefined,
  field: keyof (typeof localizedHeroDefaults)['zh-Hans'],
) {
  const normalizedLocale = locale === 'en' ? 'en' : 'zh-Hans'

  return localizedHeroDefaults[normalizedLocale][field]
}

const footerSocialPlatformOptions = [
  'github',
  'x',
  'linkedin',
  'youtube',
  'instagram',
  'discord',
  'rss',
  'email',
  'other',
] as const

function validateFooterLinkValue(
  value: unknown,
  args: {
    field: 'externalUrl' | 'internalPath'
    required?: boolean
    siblingData?: {
      type?: string
    }
  },
) {
  const expectsValue =
    args.required === true &&
    ((args.field === 'internalPath' && args.siblingData?.type === 'internal') ||
      (args.field === 'externalUrl' && args.siblingData?.type === 'external'))

  if (!expectsValue) {
    return true
  }

  return typeof value === 'string' && value.trim().length > 0
    ? true
    : args.field === 'internalPath'
      ? 'Internal path is required.'
      : 'External URL is required.'
}

function footerLinkField(args: { label: string; name?: string; required?: boolean }): Field {
  return {
    name: args.name ?? 'link',
    type: 'group',
    label: args.label,
    fields: [
      {
        name: 'type',
        type: 'radio',
        defaultValue: 'internal',
        label: 'Link type',
        options: [
          {
            label: 'Internal path',
            value: 'internal',
          },
          {
            label: 'External URL',
            value: 'external',
          },
        ],
        required: true,
      },
      {
        name: 'internalPath',
        type: 'text',
        label: 'Internal path',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'internal',
          description: 'Enter a locale-agnostic path such as /posts or /about.',
        },
        validate: (value: unknown, { siblingData }: { siblingData?: { type?: string } }) =>
          validateFooterLinkValue(value, {
            field: 'internalPath',
            required: args.required,
            siblingData,
          }),
      },
      {
        name: 'externalUrl',
        type: 'text',
        label: 'External URL',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'external',
        },
        validate: (value: unknown, { siblingData }: { siblingData?: { type?: string } }) =>
          validateFooterLinkValue(value, {
            field: 'externalUrl',
            required: args.required,
            siblingData,
          }),
      },
      {
        name: 'openInNewTab',
        type: 'checkbox',
        defaultValue: false,
        label: 'Open in new tab',
      },
    ],
  }
}

type SiteSettingsSectionEditorMode = 'form' | 'yaml'

function siteSettingsEditorModeCondition(
  modeFieldName: string,
  mode: SiteSettingsSectionEditorMode,
) {
  return (_: unknown, siblingData: Record<string, unknown> | undefined) => {
    const currentMode = siblingData?.[modeFieldName]

    return mode === 'yaml' ? currentMode === 'yaml' : currentMode !== 'yaml'
  }
}

function siteSettingsSectionModeSwitchField(args: { label: string; name: string }): Field {
  return {
    name: args.name,
    type: 'radio',
    admin: {
      components: {
        Field: '/features/site-settings/admin/SiteSettingsSectionModeSwitch#SiteSettingsSectionModeSwitch',
      },
    },
    defaultValue: 'form',
    label: args.label,
    options: [
      {
        label: 'Form',
        value: 'form',
      },
      {
        label: 'YAML',
        value: 'yaml',
      },
    ],
    virtual: true,
  }
}

function siteSettingsRawConfigField(args: { modeFieldName?: string; name: string }): Field {
  return {
    name: args.name,
    type: 'ui',
    admin: {
      ...(args.modeFieldName
        ? {
            condition: siteSettingsEditorModeCondition(args.modeFieldName, 'yaml'),
          }
        : {}),
      components: {
        Field: '/features/site-settings/admin/SiteSettingsRawSectionEditor#SiteSettingsRawSectionEditor',
      },
    },
  }
}

function siteSettingsSectionFormPanel(args: { fields: Field[]; modeFieldName: string }): Field {
  return {
    type: 'group',
    admin: {
      className: 'site-settings-section-editor__form-panel',
      condition: siteSettingsEditorModeCondition(args.modeFieldName, 'form'),
      hideGutter: true,
    },
    fields: args.fields,
    label: false,
  }
}

function siteSettingsSectionEditorFields(args: {
  formFields: Field[]
  modeFieldLabel: string
  modeFieldName: string
  rawConfigName: string
}): Field[] {
  return [
    siteSettingsSectionModeSwitchField({
      label: args.modeFieldLabel,
      name: args.modeFieldName,
    }),
    siteSettingsSectionFormPanel({
      fields: args.formFields,
      modeFieldName: args.modeFieldName,
    }),
    siteSettingsRawConfigField({
      modeFieldName: args.modeFieldName,
      name: args.rawConfigName,
    }),
  ]
}

function siteSettingsTopLevelSectionFields(args: {
  formFields: Field[]
  modeFieldLabel: string
  modeFieldName: string
  rawConfigName: string
}): Field[] {
  return siteSettingsSectionEditorFields(args)
}

const globalVariableFields: Field[] = [
  {
    name: 'owner',
    type: 'group',
    admin: {
      description:
        'Reusable owner identity for SEO, footer, homepage, previews, and the future setup wizard.',
    },
    label: 'Owner',
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Name',
      },
      {
        name: 'handle',
        type: 'text',
        admin: {
          description: 'Public handle or account name.',
        },
        label: 'Handle',
      },
      {
        name: 'email',
        type: 'email',
        label: 'Email',
      },
      {
        name: 'bio',
        type: 'textarea',
        label: 'Bio',
        localized: true,
      },
      {
        name: 'websiteUrl',
        type: 'text',
        label: 'Website URL',
      },
      {
        name: 'avatar',
        type: 'relationship',
        label: 'Avatar',
        relationTo: 'media',
      },
    ],
  },
  {
    name: 'assets',
    type: 'group',
    admin: {
      description:
        'Shared media references. YAML uses Payload media IDs, while frontend output resolves the relationship when Payload populates it.',
    },
    label: 'Shared assets',
    fields: [
      {
        name: 'logo',
        type: 'relationship',
        label: 'Logo',
        relationTo: 'media',
      },
      {
        name: 'icon',
        type: 'relationship',
        label: 'Icon',
        relationTo: 'media',
      },
      {
        name: 'avatar',
        type: 'relationship',
        label: 'Avatar',
        relationTo: 'media',
      },
      {
        name: 'defaultSocialImage',
        type: 'relationship',
        label: 'Default social image',
        relationTo: 'media',
      },
    ],
  },
  {
    name: 'socialLinks',
    type: 'array',
    admin: {
      description:
        'Shared social profiles. They can be referenced as {{social.github.label}} and {{social.github.url}}.',
    },
    label: 'Social links',
    labels: {
      plural: 'Social links',
      singular: 'Social link',
    },
    fields: [
      {
        name: 'platform',
        type: 'select',
        label: 'Platform',
        options: footerSocialPlatformOptions.map((value) => ({
          label: value,
          value,
        })),
        required: true,
      },
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        localized: true,
        required: true,
      },
      {
        name: 'url',
        type: 'text',
        label: 'URL',
        required: true,
      },
      {
        name: 'openInNewTab',
        type: 'checkbox',
        defaultValue: true,
        label: 'Open in new tab',
      },
    ],
  },
  {
    name: 'contactItems',
    type: 'array',
    admin: {
      description:
        'Reusable contact variables, referenced as {{contact.press.value}} or {{contact.press.url}}.',
    },
    label: 'Contact variables',
    labels: {
      plural: 'Contact variables',
      singular: 'Contact variable',
    },
    fields: [
      {
        name: 'key',
        type: 'text',
        admin: {
          description: 'Reference key, for example press or newsletter.',
        },
        label: 'Key',
        required: true,
        validate: validateCustomVariableKey,
      },
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        localized: true,
      },
      {
        name: 'value',
        type: 'text',
        label: 'Value',
        localized: true,
      },
      {
        name: 'url',
        type: 'text',
        label: 'URL',
      },
    ],
  },
  {
    name: 'customVariables',
    type: 'array',
    admin: {
      description:
        'Small string variables for repeated copy. Reference them with {{custom.variableKey}}.',
    },
    label: 'Custom variables',
    labels: {
      plural: 'Custom variables',
      singular: 'Custom variable',
    },
    fields: [
      {
        name: 'key',
        type: 'text',
        admin: {
          description: 'Reference key after custom., for example tagline.',
        },
        label: 'Key',
        required: true,
        validate: validateCustomVariableKey,
      },
      {
        name: 'value',
        type: 'textarea',
        label: 'Value',
        localized: true,
      },
      {
        name: 'description',
        type: 'text',
        label: 'Description',
      },
    ],
  },
]

const footerFields: Field[] = [
  {
    name: 'layoutStyle',
    type: 'select',
    admin: {
      description:
        'Controls the frontend footer layout. Preview every option under /dev/footer-layouts.',
    },
    defaultValue: defaultSiteFooterLayoutStyle,
    label: 'Layout style',
    options: siteFooterLayoutStyleOptions.map((option) => ({
      label: option.label,
      value: option.value,
    })),
    required: true,
  },
  {
    name: 'brand',
    type: 'group',
    admin: {
      description:
        'Top-left identity in the footer directory layer. Keep this concise so the navigation groups can balance beside it.',
    },
    label: 'Brand',
    fields: [
      {
        name: 'logo',
        type: 'relationship',
        relationTo: 'media',
        label: 'Logo',
      },
      {
        name: 'name',
        type: 'text',
        label: 'Brand name',
        localized: true,
      },
      {
        name: 'description',
        type: 'textarea',
        admin: {
          description: 'Short one-line description shown under the brand name.',
        },
        label: 'Brand description',
        localized: true,
      },
      {
        name: 'supportingText',
        type: 'textarea',
        admin: {
          description: 'Optional secondary line shown below the brand description.',
        },
        label: 'Supporting text',
        localized: true,
      },
      footerLinkField({
        label: 'Brand link',
      }),
    ],
  },
  {
    name: 'navigationSections',
    type: 'array',
    admin: {
      description:
        'Top directory layer. Sections auto-flow across the right side of the footer and rebalance as entries are added.',
    },
    label: 'Navigation sections',
    labels: {
      plural: 'Navigation sections',
      singular: 'Navigation section',
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        label: 'Title',
        localized: true,
        required: true,
      },
      {
        name: 'links',
        type: 'array',
        label: 'Links',
        labels: {
          plural: 'Links',
          singular: 'Link',
        },
        fields: [
          {
            name: 'label',
            type: 'text',
            label: 'Label',
            localized: true,
            required: true,
          },
          {
            name: 'description',
            type: 'text',
            label: 'Description',
            localized: true,
          },
          footerLinkField({
            label: 'Destination',
            required: true,
          }),
        ],
      },
    ],
  },
  {
    name: 'socialLinks',
    type: 'array',
    admin: {
      description:
        'Middle profile layer. Platform controls the icon; label should be the visible account or handle.',
    },
    label: 'Social links',
    labels: {
      plural: 'Social links',
      singular: 'Social link',
    },
    fields: [
      {
        name: 'platform',
        type: 'select',
        label: 'Platform',
        options: footerSocialPlatformOptions.map((value) => ({
          label: value,
          value,
        })),
        required: true,
      },
      {
        name: 'label',
        type: 'text',
        admin: {
          description: 'Visible account label or handle instead of repeating the platform name.',
        },
        label: 'Label',
        localized: true,
        required: true,
      },
      {
        name: 'url',
        type: 'text',
        label: 'URL',
        required: true,
      },
      {
        name: 'openInNewTab',
        type: 'checkbox',
        defaultValue: true,
        label: 'Open in new tab',
      },
    ],
  },
  {
    name: 'contactItems',
    type: 'array',
    admin: {
      description:
        'Middle profile layer. Use this for email, newsletter, or other owner contact records.',
    },
    label: 'Contact items',
    labels: {
      plural: 'Contact items',
      singular: 'Contact item',
    },
    fields: [
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        localized: true,
        required: true,
      },
      {
        name: 'value',
        type: 'text',
        label: 'Value',
        localized: true,
        required: true,
      },
      footerLinkField({
        label: 'Optional link',
      }),
    ],
  },
  {
    name: 'legalLinks',
    type: 'array',
    admin: {
      description:
        'Bottom-left metadata layer. Use for privacy, terms, and other low-frequency legal links.',
    },
    label: 'Legal links',
    labels: {
      plural: 'Legal links',
      singular: 'Legal link',
    },
    fields: [
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        localized: true,
        required: true,
      },
      footerLinkField({
        label: 'Destination',
        required: true,
      }),
    ],
  },
  {
    name: 'compliance',
    type: 'group',
    admin: {
      description:
        'Bottom metadata layer. Filings render on the left; copyright renders on the right on desktop.',
    },
    label: 'Compliance',
    fields: [
      {
        name: 'copyright',
        type: 'text',
        label: 'Copyright',
        localized: true,
      },
      {
        name: 'filings',
        type: 'array',
        label: 'Compliance filings',
        labels: {
          plural: 'Compliance filings',
          singular: 'Compliance filing',
        },
        fields: [
          {
            name: 'label',
            type: 'text',
            label: 'Label',
            localized: true,
            required: true,
          },
          {
            name: 'value',
            type: 'text',
            label: 'Value',
            localized: true,
            required: true,
          },
          {
            name: 'href',
            type: 'text',
            label: 'Link',
          },
        ],
      },
    ],
  },
  {
    name: 'bottomBar',
    type: 'group',
    admin: {
      description:
        'Bottom-right note shown with the copyright line, commonly used for powered-by or ownership text.',
    },
    label: 'Bottom bar',
    fields: [
      {
        name: 'note',
        type: 'textarea',
        label: 'Note',
        localized: true,
      },
    ],
  },
]

const footerLayoutFields: Field[] = [
  {
    type: 'row',
    admin: {
      className: 'site-settings-preview-grid site-settings-preview-grid--footer',
    },
    fields: [
      {
        type: 'collapsible',
        admin: {
          className: 'site-settings-preview-grid__controls',
          initCollapsed: false,
        },
        fields: [
          {
            name: 'footerPresetActions',
            type: 'ui',
            admin: {
              components: {
                Field: '/features/site-settings/admin/SiteFooterPresetActions#SiteFooterPresetActions',
              },
            },
          },
          ...siteSettingsSectionEditorFields({
            formFields: footerFields,
            modeFieldLabel: 'Footer editing mode',
            modeFieldName: 'footerEditorMode',
            rawConfigName: 'footerRawConfig',
          }),
        ],
        label: 'Footer controls',
      },
      {
        name: 'footerPreview',
        type: 'ui',
        admin: {
          components: {
            Field: '/features/site-settings/admin/SiteFooterPreview#SiteFooterPreview',
          },
        },
      },
    ],
  },
]

function articleDesignAdvancedField(
  config: (typeof articleDesignAdvancedControlConfigs)[number],
): Field {
  return {
    name: config.name,
    type: 'text',
    admin: {
      components: {
        Field: '/features/article/admin/ArticleDesignRangeField#ArticleDesignRangeField',
      },
      description: config.description,
      width: '50%',
    },
    label: config.label,
    validate:
      config.name === 'bodyLineHeight'
        ? validateArticleDesignLineHeight
        : validateArticleDesignLength,
  }
}

const articleLayoutFields: Field[] = [
  {
    type: 'row',
    admin: {
      className: 'article-layout-settings-grid',
    },
    fields: [
      {
        type: 'collapsible',
        admin: {
          className: 'article-layout-settings__controls',
          initCollapsed: false,
        },
        fields: siteSettingsSectionEditorFields({
          formFields: [
            {
              name: 'preset',
              type: 'select',
              admin: {
                description: 'Choose the default article design preset for public article pages.',
              },
              defaultValue: defaultArticleDesignPresetID,
              label: 'Preset',
              options: articleDesignPresetOptions,
              required: true,
            },
            {
              name: 'typography',
              type: 'group',
              admin: {
                description:
                  'Optional font stack overrides. Leave blank to inherit the selected design preset.',
                width: '100%',
              },
              fields: [
                {
                  name: 'latinFont',
                  type: 'select',
                  admin: {
                    description: 'Western body text font stack.',
                    width: '50%',
                  },
                  label: 'Latin font',
                  options: [...articleDesignLatinFontOptions],
                },
                {
                  name: 'cjkFont',
                  type: 'select',
                  admin: {
                    description: 'Chinese body text fallback stack.',
                    width: '50%',
                  },
                  label: 'CJK font',
                  options: [...articleDesignCJKFontOptions],
                },
                {
                  name: 'headingFont',
                  type: 'select',
                  admin: {
                    description: 'Heading font stack. The default keeps headings in a serif voice.',
                    width: '50%',
                  },
                  label: 'Heading font',
                  options: [...articleDesignHeadingFontOptions],
                },
                {
                  name: 'codeFont',
                  type: 'select',
                  admin: {
                    description: 'Inline and block code font stack.',
                    width: '50%',
                  },
                  label: 'Code font',
                  options: [...articleDesignCodeFontOptions],
                },
              ],
              label: 'Typography',
            },
            {
              name: 'advanced',
              type: 'group',
              admin: {
                description:
                  'Optional safe CSS token overrides. Sliders start from the selected preset defaults.',
                width: '100%',
              },
              fields: articleDesignAdvancedControlConfigs.map(articleDesignAdvancedField),
              label: 'Advanced overrides',
            },
          ],
          modeFieldLabel: 'Article design editing mode',
          modeFieldName: 'articleLayoutEditorMode',
          rawConfigName: 'articleLayoutRawConfig',
        }),
        label: 'Article design controls',
      },
      {
        name: 'preview',
        type: 'ui',
        admin: {
          components: {
            Field: '/features/article/admin/ArticleLayoutPreview#ArticleLayoutPreview',
          },
        },
      },
    ],
  },
]

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  access: {
    read: anyone,
    update: editorOnly,
  },
  admin: {
    description:
      'Configure the homepage hero copy and the structured footer content shown on the frontend.',
    group: 'Frontend',
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc }) => {
        const validation = validateSiteSettingReferences({
          ...(originalDoc && typeof originalDoc === 'object' ? originalDoc : {}),
          ...(data && typeof data === 'object' ? data : {}),
        })

        if (!validation.valid) {
          throw new Error(
            `Unknown site setting reference: ${validation.unknownReferences.join(', ')}.`,
          )
        }

        return data
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          id: 'general',
          label: 'General',
          fields: siteSettingsTopLevelSectionFields({
            rawConfigName: 'generalRawConfig',
            modeFieldLabel: 'General editing mode',
            modeFieldName: 'generalEditorMode',
            formFields: [
              {
                name: 'siteName',
                type: 'text',
                defaultValue: defaultSiteName,
                label: 'Site name',
                required: true,
              },
              {
                name: 'siteDescription',
                type: 'textarea',
                defaultValue: ({ locale }) => getLocalizedHeroDefault(locale, 'siteDescription'),
                label: 'Site description',
                localized: true,
              },
              {
                name: 'globalVariables',
                type: 'group',
                admin: {
                  description:
                    'Shared variables used by other site setting sections. Use {{site.name}}, {{site.currentYear}}, {{owner.name}}, {{custom.tagline}}, or social/contact paths in text fields.',
                },
                label: 'Global variables',
                fields: globalVariableFields,
              },
            ],
          }),
        },
        {
          id: 'homepage',
          label: 'Homepage',
          fields: siteSettingsTopLevelSectionFields({
            rawConfigName: 'homepageRawConfig',
            modeFieldLabel: 'Homepage editing mode',
            modeFieldName: 'homepageEditorMode',
            formFields: [
              {
                name: 'homeHero',
                type: 'group',
                label: 'Homepage hero',
                fields: [
                  {
                    name: 'eyebrow',
                    type: 'text',
                    defaultValue: ({ locale }) => getLocalizedHeroDefault(locale, 'eyebrow'),
                    label: 'Eyebrow',
                    localized: true,
                  },
                  {
                    name: 'title',
                    type: 'text',
                    defaultValue: ({ locale }) => getLocalizedHeroDefault(locale, 'title'),
                    label: 'Title',
                    localized: true,
                  },
                  {
                    name: 'description',
                    type: 'textarea',
                    defaultValue: ({ locale }) => getLocalizedHeroDefault(locale, 'description'),
                    label: 'Description',
                    localized: true,
                  },
                ],
              },
            ],
          }),
        },
        {
          id: 'seo',
          label: 'SEO',
          fields: siteSettingsTopLevelSectionFields({
            rawConfigName: 'seoRawConfig',
            modeFieldLabel: 'SEO editing mode',
            modeFieldName: 'seoEditorMode',
            formFields: [
              {
                name: 'seo',
                type: 'group',
                label: 'SEO & sharing',
                fields: [
                  {
                    name: 'homeTitle',
                    type: 'text',
                    admin: {
                      description:
                        'Optional SEO title override for the localized homepage. Leave blank to reuse the homepage hero title.',
                    },
                    localized: true,
                    maxLength: 70,
                    label: 'Homepage SEO title',
                  },
                  {
                    name: 'homeDescription',
                    type: 'textarea',
                    admin: {
                      description:
                        'Optional SEO description override for the localized homepage. Leave blank to reuse the site description.',
                    },
                    localized: true,
                    maxLength: 180,
                    label: 'Homepage SEO description',
                  },
                  {
                    name: 'defaultSocialImage',
                    type: 'relationship',
                    relationTo: 'media',
                    label: 'Default social image',
                  },
                ],
              },
            ],
          }),
        },
        {
          id: 'article-layout',
          label: 'Article design',
          fields: [
            {
              name: 'articleLayout',
              type: 'group',
              admin: {
                description:
                  'Configure the code-owned article design preset and a small set of safe spacing overrides.',
              },
              label: 'Article design',
              fields: articleLayoutFields,
            },
          ],
        },
        {
          id: 'footer',
          label: 'Footer',
          fields: [
            {
              name: 'footer',
              type: 'group',
              label: 'Footer',
              fields: footerLayoutFields,
            },
          ],
        },
      ],
    },
  ],
}
