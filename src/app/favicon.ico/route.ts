const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#111318"/>
  <path d="M9 10h14l-9.5 12H23v2H9v-2l9.5-12H9z" fill="#f4f0e8"/>
</svg>`

export function GET() {
  return new Response(faviconSvg, {
    headers: {
      'Cache-Control': 'public, max-age=86400',
      'Content-Type': 'image/svg+xml; charset=utf-8',
    },
  })
}
