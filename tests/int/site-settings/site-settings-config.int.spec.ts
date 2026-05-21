import { describe, expect, it } from 'vitest'

import {
  buildSiteVariableContext,
  parseSiteSettingsSectionYAML,
  resolveSiteSettingReferences,
  serializeSiteSettingsSectionToYAML,
  siteSettingsSectionIDs,
  validateSiteSettingReferences,
} from '@/features/site-settings/model/site-settings-config'

describe('site settings config helpers', () => {
  const settings = {
    siteName: 'ZBlog',
    siteDescription: 'Notes about building products.',
    siteURL: 'https://zblog.example',
    globalVariables: {
      owner: {
        bio: 'Builder and writer.',
        email: 'hi@example.com',
        handle: '@zenor0',
        name: 'Zenoro',
        websiteUrl: 'https://example.com',
      },
      assets: {
        avatar: 42,
        defaultSocialImage: { id: 77, url: '/media/social.png' },
        icon: 7,
        logo: { id: 11, url: '/media/logo.png' },
      },
      customVariables: [
        {
          key: 'tagline',
          value: 'Independent writing practice.',
        },
      ],
      socialLinks: [
        {
          label: '@zenor0',
          platform: 'github',
          url: 'https://github.com/zenor0',
        },
        {
          label: '@duplicate',
          platform: 'github',
          url: 'https://github.com/duplicate',
        },
      ],
    },
    homeHero: {
      description: 'Written by {{owner.name}}.',
      eyebrow: '{{custom.tagline}}',
      title: '{{site.name}} by {{owner.name}}',
    },
    appearance: {
      accentColor: '#14b8a6',
    },
    seo: {
      defaultSocialImage: '{{assets.defaultSocialImage}}',
      homeDescription: '{{site.description}}',
      homeTitle: '{{site.name}}',
    },
    footer: {
      brand: {
        name: '{{site.name}}',
        description: 'Follow {{social.github.label}}.',
      },
      socialLinks: [
        {
          label: '{{social.github.label}}',
          platform: 'github',
          url: '{{social.github.url}}',
        },
      ],
    },
  }

  it('builds typed global variable paths plus custom variables', () => {
    const context = buildSiteVariableContext(settings)

    expect(context['site.name']).toBe('ZBlog')
    expect(context['site.description']).toBe('Notes about building products.')
    expect(context['site.url']).toBe('https://zblog.example')
    expect(context['site.currentYear']).toBe(String(new Date().getFullYear()))
    expect(context['owner.name']).toBe('Zenoro')
    expect(context['owner.handle']).toBe('@zenor0')
    expect(context['assets.logo']).toBe(11)
    expect(context['assets.defaultSocialImage']).toBe(77)
    expect(context['custom.tagline']).toBe('Independent writing practice.')
    expect(context['social.github.label']).toBe('@zenor0')
    expect(context['social.github.url']).toBe('https://github.com/zenor0')
  })

  it('resolves references on display without mutating global variable definitions', () => {
    const resolved = resolveSiteSettingReferences(settings)

    expect(resolved.homeHero?.title).toBe('ZBlog by Zenoro')
    expect(resolved.homeHero?.eyebrow).toBe('Independent writing practice.')
    expect(resolved.seo?.homeTitle).toBe('ZBlog')
    expect(resolved.seo?.defaultSocialImage).toBe(77)
    expect(resolved.footer?.brand?.name).toBe('ZBlog')
    expect(resolved.footer?.brand?.description).toBe('Follow @zenor0.')
    expect(resolved.footer?.socialLinks?.[0]?.url).toBe('https://github.com/zenor0')
    expect(resolved.globalVariables?.customVariables?.[0]?.value).toBe(
      'Independent writing practice.',
    )
    expect(settings.homeHero.title).toBe('{{site.name}} by {{owner.name}}')
  })

  it('reports unknown or malformed references before save', () => {
    expect(validateSiteSettingReferences(settings).valid).toBe(true)

    const invalid = validateSiteSettingReferences({
      ...settings,
      homeHero: {
        title: '{{missing.value}}',
      },
      footer: {
        brand: {
          description: 'Broken {{site name}}',
        },
      },
    })

    expect(invalid.valid).toBe(false)
    expect(invalid.unknownReferences).toEqual(['missing.value', 'site name'])
  })

  it('round-trips per-section YAML using current-locale values and media IDs', () => {
    expect(siteSettingsSectionIDs).toEqual([
      'general',
      'homepage',
      'seo',
      'articleLayout',
      'footer',
    ])

    const yaml = serializeSiteSettingsSectionToYAML('seo', settings)

    expect(yaml).toContain('seo:')
    expect(yaml).toContain('homeTitle: "{{site.name}}"')
    expect(yaml).toContain('defaultSocialImage: "{{assets.defaultSocialImage}}"')

    const parsed = parseSiteSettingsSectionYAML(
      'seo',
      ['seo:', '  homeTitle: "{{site.name}}"', '  defaultSocialImage: 77'].join('\n'),
    )

    expect(parsed).toEqual({
      seo: {
        defaultSocialImage: 77,
        homeTitle: '{{site.name}}',
      },
    })

    const generalYaml = serializeSiteSettingsSectionToYAML('general', settings)

    expect(generalYaml).toContain('appearance:')
    expect(generalYaml).toContain('accentColor: "#14b8a6"')
    expect(generalYaml).toContain('siteURL: https://zblog.example')

    const parsedGeneral = parseSiteSettingsSectionYAML(
      'general',
      [
        'siteName: ZBlog',
        'siteURL: https://parsed.example',
        'appearance:',
        '  accentColor: "#0f766e"',
      ].join('\n'),
    )

    expect(parsedGeneral).toEqual({
      appearance: {
        accentColor: '#0f766e',
      },
      siteName: 'ZBlog',
      siteURL: 'https://parsed.example',
    })
  })

  it('rejects malformed YAML, unknown root fields, and wrong section shapes', () => {
    expect(() => parseSiteSettingsSectionYAML('homepage', 'homeHero: [')).toThrow(/Invalid YAML/)
    expect(() => parseSiteSettingsSectionYAML('homepage', 'seo:\n  homeTitle: Test')).toThrow(
      /not allowed/,
    )
    expect(() => parseSiteSettingsSectionYAML('homepage', 'homeHero: title only')).toThrow(
      /must be an object/,
    )
  })
})
