'use client'

import type { UIFieldClientComponent } from 'payload'

import { useFormFields, useLocale } from '@payloadcms/ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { SiteSettings } from '@/features/site-settings/model/site-settings'
import {
  buildSiteFooterPreviewURL,
  isSiteFooterPreviewReadyMessage,
  isSiteFooterPreviewResizeMessage,
  resolveSiteFooterPreviewLocale,
  siteFooterPreviewMessageType,
} from '@/features/site-settings/model/site-footer-preview'

import './site-footer-preview.scss'

type FormFieldState = {
  value?: unknown
}

type SiteFooterPreviewFormState = Record<string, FormFieldState | undefined>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function getBooleanValue(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

function readRecordValue(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  const pathValue = fields?.[path]?.value

  if (isRecord(pathValue)) {
    return pathValue
  }

  return isRecord(fallback) ? fallback : {}
}

function isIndexSegment(value: string) {
  return /^\d+$/.test(value)
}

function setNestedValue(target: Record<string, unknown>, path: string[], value: unknown) {
  let current: Record<string, unknown> | unknown[] = target

  path.forEach((segment, index) => {
    const isLast = index === path.length - 1
    const key = Array.isArray(current) && isIndexSegment(segment) ? Number(segment) : segment

    if (isLast) {
      current[key as keyof typeof current] = value as never
      return
    }

    const nextSegment = path[index + 1] ?? ''
    const nextValue = current[key as keyof typeof current]

    if (!isRecord(nextValue) && !Array.isArray(nextValue)) {
      current[key as keyof typeof current] = (isIndexSegment(nextSegment) ? [] : {}) as never
    }

    current = current[key as keyof typeof current] as Record<string, unknown> | unknown[]
  })
}

function readObjectWithNestedFields(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  const value = {
    ...readRecordValue(fields, path, fallback),
  }
  const pathPrefix = `${path}.`

  Object.entries(fields ?? {}).forEach(([fieldPath, state]) => {
    if (!fieldPath.startsWith(pathPrefix) || state?.value === undefined) {
      return
    }

    setNestedValue(value, fieldPath.slice(pathPrefix.length).split('.'), state.value)
  })

  return value
}

function readArrayValue(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  const pathValue = fields?.[path]?.value
  const baseValue = Array.isArray(pathValue) ? pathValue : Array.isArray(fallback) ? fallback : []
  const nextValue = [...baseValue]
  const pathPrefix = `${path}.`

  Object.keys(fields ?? {}).forEach((fieldPath) => {
    if (!fieldPath.startsWith(pathPrefix)) {
      return
    }

    const index = Number(fieldPath.slice(pathPrefix.length).split('.')[0])

    if (Number.isInteger(index) && index >= 0 && nextValue[index] == null) {
      nextValue[index] = {}
    }
  })

  return nextValue
}

function readStringField(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  return getStringValue(fields?.[path]?.value) ?? getStringValue(fallback)
}

function readBooleanField(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  return getBooleanValue(fields?.[path]?.value) ?? getBooleanValue(fallback)
}

function readFooterLink(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  const link = readRecordValue(fields, path, fallback)

  return {
    ...link,
    externalUrl: readStringField(fields, `${path}.externalUrl`, link.externalUrl),
    internalPath: readStringField(fields, `${path}.internalPath`, link.internalPath),
    openInNewTab: readBooleanField(fields, `${path}.openInNewTab`, link.openInNewTab),
    type: readStringField(fields, `${path}.type`, link.type),
  }
}

function readFooterBrand(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  const brand = readRecordValue(fields, path, fallback)

  return {
    ...brand,
    description: readStringField(fields, `${path}.description`, brand.description),
    link: readFooterLink(fields, `${path}.link`, brand.link),
    name: readStringField(fields, `${path}.name`, brand.name),
    supportingText: readStringField(fields, `${path}.supportingText`, brand.supportingText),
  }
}

function readNavigationLinks(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  return readArrayValue(fields, path, fallback).map((item, index) => {
    const itemPath = `${path}.${index}`
    const linkItem = readRecordValue(fields, itemPath, item)

    return {
      ...linkItem,
      description: readStringField(fields, `${itemPath}.description`, linkItem.description),
      label: readStringField(fields, `${itemPath}.label`, linkItem.label),
      link: readFooterLink(fields, `${itemPath}.link`, linkItem.link),
    }
  })
}

function readNavigationSections(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  return readArrayValue(fields, path, fallback).map((item, index) => {
    const itemPath = `${path}.${index}`
    const section = readRecordValue(fields, itemPath, item)

    return {
      ...section,
      links: readNavigationLinks(fields, `${itemPath}.links`, section.links),
      title: readStringField(fields, `${itemPath}.title`, section.title),
    }
  })
}

function readSocialLinks(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  return readArrayValue(fields, path, fallback).map((item, index) => {
    const itemPath = `${path}.${index}`
    const socialLink = readRecordValue(fields, itemPath, item)

    return {
      ...socialLink,
      label: readStringField(fields, `${itemPath}.label`, socialLink.label),
      openInNewTab: readBooleanField(fields, `${itemPath}.openInNewTab`, socialLink.openInNewTab),
      platform: readStringField(fields, `${itemPath}.platform`, socialLink.platform),
      url: readStringField(fields, `${itemPath}.url`, socialLink.url),
    }
  })
}

function readContactItems(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  return readArrayValue(fields, path, fallback).map((item, index) => {
    const itemPath = `${path}.${index}`
    const contactItem = readRecordValue(fields, itemPath, item)

    return {
      ...contactItem,
      label: readStringField(fields, `${itemPath}.label`, contactItem.label),
      link: readFooterLink(fields, `${itemPath}.link`, contactItem.link),
      value: readStringField(fields, `${itemPath}.value`, contactItem.value),
    }
  })
}

function readLegalLinks(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  return readArrayValue(fields, path, fallback).map((item, index) => {
    const itemPath = `${path}.${index}`
    const legalLink = readRecordValue(fields, itemPath, item)

    return {
      ...legalLink,
      label: readStringField(fields, `${itemPath}.label`, legalLink.label),
      link: readFooterLink(fields, `${itemPath}.link`, legalLink.link),
    }
  })
}

function readComplianceFilings(
  fields: SiteFooterPreviewFormState | undefined,
  path: string,
  fallback: unknown,
) {
  return readArrayValue(fields, path, fallback).map((item, index) => {
    const itemPath = `${path}.${index}`
    const filing = readRecordValue(fields, itemPath, item)

    return {
      ...filing,
      href: readStringField(fields, `${itemPath}.href`, filing.href),
      label: readStringField(fields, `${itemPath}.label`, filing.label),
      value: readStringField(fields, `${itemPath}.value`, filing.value),
    }
  })
}

function readFooterData(fields: SiteFooterPreviewFormState | undefined) {
  const footer = readRecordValue(fields, 'footer', fields?.footer?.value)
  const hasLiveFooterPaths = Object.keys(fields ?? {}).some((path) => path.startsWith('footer.'))

  if (Object.keys(footer).length === 0 && !hasLiveFooterPaths) {
    return null
  }

  const compliance = readRecordValue(fields, 'footer.compliance', footer.compliance)
  const bottomBar = readRecordValue(fields, 'footer.bottomBar', footer.bottomBar)

  return {
    ...footer,
    bottomBar: {
      ...bottomBar,
      note: readStringField(fields, 'footer.bottomBar.note', bottomBar.note),
    },
    brand: readFooterBrand(fields, 'footer.brand', footer.brand),
    compliance: {
      ...compliance,
      copyright: readStringField(fields, 'footer.compliance.copyright', compliance.copyright),
      filings: readComplianceFilings(fields, 'footer.compliance.filings', compliance.filings),
    },
    contactItems: readContactItems(fields, 'footer.contactItems', footer.contactItems),
    layoutStyle: readStringField(fields, 'footer.layoutStyle', footer.layoutStyle),
    legalLinks: readLegalLinks(fields, 'footer.legalLinks', footer.legalLinks),
    navigationSections: readNavigationSections(
      fields,
      'footer.navigationSections',
      footer.navigationSections,
    ),
    socialLinks: readSocialLinks(fields, 'footer.socialLinks', footer.socialLinks),
  }
}

function readSiteSettings(fields: SiteFooterPreviewFormState | undefined): SiteSettings {
  const siteName = getStringValue(fields?.siteName?.value) ?? 'ZBlog'
  const siteDescription = getStringValue(fields?.siteDescription?.value)
  const globalVariables = readObjectWithNestedFields(
    fields,
    'globalVariables',
    fields?.globalVariables?.value,
  )
  const footer = readFooterData(fields)

  return {
    footer,
    globalVariables,
    siteDescription,
    siteName,
  } as SiteSettings
}

export const SiteFooterPreview: UIFieldClientComponent = () => {
  const fields = useFormFields(([formFields]) => formFields as SiteFooterPreviewFormState)
  const locale = useLocale()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [iframeHeight, setIframeHeight] = useState(280)
  const previewLocale = resolveSiteFooterPreviewLocale(locale?.code)
  const settings = useMemo(() => readSiteSettings(fields), [fields])
  const previewURL = useMemo(() => buildSiteFooterPreviewURL(previewLocale), [previewLocale])

  const postSettingsToFrame = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        locale: previewLocale,
        settings,
        type: siteFooterPreviewMessageType,
      },
      window.location.origin,
    )
  }, [previewLocale, settings])

  useEffect(() => {
    postSettingsToFrame()
  }, [postSettingsToFrame])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return
      }

      if (isSiteFooterPreviewReadyMessage(event.data)) {
        postSettingsToFrame()
        return
      }

      if (isSiteFooterPreviewResizeMessage(event.data)) {
        setIframeHeight(Math.max(240, Math.ceil(event.data.height)))
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [postSettingsToFrame])

  return (
    <section className="site-footer-preview" data-testid="site-footer-preview">
      <div className="site-footer-preview__header">
        <span>Footer preview</span>
        <strong>Production iframe</strong>
      </div>

      <div className="site-footer-preview__surface">
        <iframe
          className="site-footer-preview__iframe"
          data-testid="site-footer-preview-iframe"
          onLoad={postSettingsToFrame}
          ref={iframeRef}
          src={previewURL}
          style={{ height: iframeHeight }}
          title="Production footer preview"
        />
      </div>
    </section>
  )
}
