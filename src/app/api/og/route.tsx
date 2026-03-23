import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

const imageSize = {
  height: 630,
  width: 1200,
} as const

function normalizeParam(value: null | string, maxLength: number) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return null
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const eyebrow = normalizeParam(searchParams.get('eyebrow'), 48) ?? 'ZBlog'
  const title = normalizeParam(searchParams.get('title'), 96) ?? 'ZBlog'
  const description = normalizeParam(searchParams.get('description'), 180)

  return new ImageResponse(
    (
      <div
        style={{
          background:
            'linear-gradient(135deg, rgb(247, 241, 225) 0%, rgb(242, 235, 214) 40%, rgb(233, 222, 198) 100%)',
          color: 'rgb(34, 24, 16)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          padding: '68px 72px',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 18,
          }}
        >
          <div
            style={{
              background: 'rgb(34, 24, 16)',
              borderRadius: 999,
              display: 'flex',
              height: 20,
              width: 20,
            }}
          />
          <div
            style={{
              color: 'rgba(34, 24, 16, 0.72)',
              display: 'flex',
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            maxWidth: 960,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 78,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1.04,
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                color: 'rgba(34, 24, 16, 0.76)',
                display: 'flex',
                fontSize: 34,
                lineHeight: 1.35,
                maxWidth: 880,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>

        <div
          style={{
            color: 'rgba(34, 24, 16, 0.58)',
            display: 'flex',
            fontSize: 24,
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex' }}>zblog</div>
          <div style={{ display: 'flex' }}>payload cms · next.js</div>
        </div>
      </div>
    ),
    imageSize,
  )
}
