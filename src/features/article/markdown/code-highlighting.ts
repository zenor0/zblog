import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import diff from 'highlight.js/lib/languages/diff'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import scss from 'highlight.js/lib/languages/scss'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

const languageAliasMap: Record<string, string> = {
  cjs: 'javascript',
  html: 'xml',
  js: 'javascript',
  jsx: 'javascript',
  md: 'markdown',
  mjs: 'javascript',
  shell: 'bash',
  sh: 'bash',
  svg: 'xml',
  ts: 'typescript',
  tsx: 'typescript',
  yml: 'yaml',
  zsh: 'bash',
}

const plainTextLanguages = new Set(['plain', 'plaintext', 'text', 'txt'])

const htmlEscapes: Record<string, string> = {
  '"': '&quot;',
  '&': '&amp;',
  "'": '&#39;',
  '<': '&lt;',
  '>': '&gt;',
}

function registerLanguage(name: string, language: Parameters<typeof hljs.registerLanguage>[1]) {
  if (!hljs.getLanguage(name)) {
    hljs.registerLanguage(name, language)
  }
}

registerLanguage('bash', bash)
registerLanguage('css', css)
registerLanguage('diff', diff)
registerLanguage('javascript', javascript)
registerLanguage('json', json)
registerLanguage('markdown', markdown)
registerLanguage('python', python)
registerLanguage('scss', scss)
registerLanguage('sql', sql)
registerLanguage('typescript', typescript)
registerLanguage('xml', xml)
registerLanguage('yaml', yaml)

export function escapeCodeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => htmlEscapes[character] ?? character)
}

export function extractCodeLanguageFromClassName(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const languageMatch = value.match(/(?:^|\s)language-([^\s]+)/i)
  const language = languageMatch?.[1]?.trim().toLowerCase()

  return language || null
}

export function normalizeCodeLanguage(value: null | string | undefined) {
  const language = value?.trim().toLowerCase()

  if (!language) {
    return null
  }

  if (plainTextLanguages.has(language)) {
    return 'plaintext'
  }

  return languageAliasMap[language] ?? language
}

export function highlightCodeSnippet(code: string, language: null | string | undefined) {
  const normalizedLanguage = normalizeCodeLanguage(language)

  if (
    !normalizedLanguage ||
    normalizedLanguage === 'plaintext' ||
    !hljs.getLanguage(normalizedLanguage)
  ) {
    return {
      highlighted: false,
      html: escapeCodeHtml(code),
      language: null,
    }
  }

  const result = hljs.highlight(code, {
    ignoreIllegals: true,
    language: normalizedLanguage,
  })

  return {
    highlighted: true,
    html: result.value,
    language: normalizedLanguage,
  }
}
