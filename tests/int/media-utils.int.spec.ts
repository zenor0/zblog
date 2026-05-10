import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { buildPDFPreviewFallbackSVG } from '@/lib/pdf-preview'
import {
  inferMediaKind,
  resolveAttachmentDescription,
  resolveMediaAsset,
  resolveMediaCaption,
} from '@/lib/media'
import { resolveLocalMediaPath } from '@/lib/media-server'

describe('media utilities', () => {
  it('classifies raster, vector, and pdf assets', () => {
    expect(inferMediaKind({ src: '/media/photo.png' })).toBe('image')
    expect(inferMediaKind({ src: '/media/diagram.svg' })).toBe('vector')
    expect(inferMediaKind({ mimeType: 'application/pdf', src: '/media/report.bin' })).toBe('pdf')
  })

  it('builds render descriptors for pdf previews', () => {
    const asset = resolveMediaAsset({
      alt: 'Quarterly report',
      src: '/media/report.pdf',
    })

    expect(asset).toMatchObject({
      alt: 'Quarterly report',
      downloadURL: '/media/report.pdf',
      extensionLabel: 'PDF',
      kind: 'pdf',
      previewURL: '/api/media/preview?filename=report.pdf.page-1.svg',
    })
  })

  it('keeps dynamic pdf rendering for non-default pages or watermarking', () => {
    const asset = resolveMediaAsset({
      media: {
        alt: 'Quarterly report',
        caption: null,
        credit: null,
        filename: 'report.pdf',
        height: null,
        mimeType: 'application/pdf',
        previewSVGURL: '/api/media/preview?filename=report.pdf.page-1.svg',
        url: '/media/report.pdf',
        width: null,
      },
      options: {
        page: 2,
      },
    })

    expect(asset?.previewURL).toBe('/api/media/render?src=%2Fmedia%2Freport.pdf&page=2')
  })

  it('only resolves local upload paths inside the media directory', () => {
    expect(resolveLocalMediaPath('/media/research/report.pdf')).toBe(
      path.resolve(process.cwd(), '.data', 'media', 'research', 'report.pdf'),
    )
    expect(resolveLocalMediaPath('/api/media/file/report.pdf')).toBe(
      path.resolve(process.cwd(), '.data', 'media', 'report.pdf'),
    )
    expect(resolveLocalMediaPath('/media/../secret.pdf')).toBeNull()
    expect(resolveLocalMediaPath('/api/media/file/..%2Fsecret.pdf')).toBeNull()
    expect(resolveLocalMediaPath('https://example.com/report.pdf')).toBeNull()
  })

  it('embeds invisible metadata in fallback previews', () => {
    const svg = buildPDFPreviewFallbackSVG({
      filename: 'deck.pdf',
      page: 2,
      sourceURL: '/media/deck.pdf',
      debugReason: 'Could not map media URL to local upload path',
      watermarkToken: 'reader-42',
    })

    expect(svg).toContain('<metadata id="zblog-render-metadata">')
    expect(svg).toContain(
      '&quot;debugReason&quot;:&quot;Could not map media URL to local upload path&quot;',
    )
    expect(svg).toContain('&quot;watermarkToken&quot;:&quot;reader-42&quot;')
    expect(svg).toContain('Page 2')
  })

  it('resolves image captions with a fallback chain', () => {
    expect(
      resolveMediaCaption({
        alt: 'Alt fallback',
        caption: 'Stored caption',
        title: 'Markdown title',
      }),
    ).toBe('Stored caption')
    expect(
      resolveMediaCaption({
        alt: 'Alt fallback',
        caption: '   ',
        title: 'Markdown title',
      }),
    ).toBe('Markdown title')
    expect(
      resolveMediaCaption({
        alt: 'Alt fallback',
        caption: null,
        title: '   ',
      }),
    ).toBe('Alt fallback')
  })

  it('keeps attachment descriptions independent from alt text', () => {
    expect(
      resolveAttachmentDescription({
        caption: 'Media caption',
        description: 'Attachment description',
      }),
    ).toBe('Attachment description')
    expect(
      resolveAttachmentDescription({
        caption: 'Media caption',
        description: '   ',
      }),
    ).toBe('Media caption')
    expect(
      resolveAttachmentDescription({
        caption: null,
        description: null,
      }),
    ).toBeNull()
  })
})
