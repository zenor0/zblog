import fs from 'fs/promises'
import os from 'os'
import path from 'path'

type WorkspaceVariant = {
  bodyAppendix?: string
  title: string
}

const bibliographySource = `@article{doe2025,
  author = {Doe, Jamie},
  title = {Composable Publishing Workflows},
  journal = {Journal of Structured Writing},
  year = {2025},
  volume = {4},
  number = {1},
  pages = {20--31}
}
`

const heroSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img">
  <rect width="1200" height="720" fill="#f5f1e8"/>
  <rect x="88" y="96" width="1024" height="528" rx="24" fill="#ffffff" stroke="#d7cec0"/>
  <circle cx="914" cy="304" r="112" fill="#d97e56" opacity="0.92"/>
  <text x="154" y="432" font-family="Georgia, serif" font-size="72" fill="#201d18">mdship workspace</text>
</svg>
`

function buildDocumentMarkdown(variant: WorkspaceVariant) {
  return `---
title: ${variant.title}
status: published
bibliography:
  - bibliography.bib
---

# ${variant.title}

This article was imported from an mdship workspace and cites [@doe2025].

![Imported hero](assets/hero.svg)

${variant.bodyAppendix ?? ''}
`
}

function buildManifest() {
  return JSON.stringify(
    {
      bibliography: 'bibliography.bib',
      citations: ['doe2025'],
      document: 'document.md',
      resources: [
        {
          kind: 'local',
          original: '/tmp/source/hero.svg',
          packaged: 'assets/hero.svg',
          status: 'ok',
        },
      ],
      version: '0.1.0',
      warnings: [],
    },
    null,
    2,
  )
}

export async function createMDshipWorkspaceFiles() {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zblog-mdship-workspace-'))

  async function writeVariant(dirName: string, variant: WorkspaceVariant) {
    const workspaceDir = path.join(rootDir, dirName)
    const assetsDir = path.join(workspaceDir, 'assets')
    const debugDir = path.join(workspaceDir, 'debug')

    await fs.mkdir(assetsDir, {
      recursive: true,
    })
    await fs.mkdir(debugDir, {
      recursive: true,
    })

    await Promise.all([
      fs.writeFile(path.join(workspaceDir, 'manifest.json'), buildManifest(), 'utf8'),
      fs.writeFile(path.join(workspaceDir, 'document.md'), buildDocumentMarkdown(variant), 'utf8'),
      fs.writeFile(path.join(workspaceDir, 'bibliography.bib'), bibliographySource, 'utf8'),
      fs.writeFile(path.join(assetsDir, 'hero.svg'), heroSvg, 'utf8'),
      fs.writeFile(path.join(debugDir, 'markdown.md'), '# ignored debug markdown\n', 'utf8'),
    ])

    return workspaceDir
  }

  async function cleanup() {
    await fs.rm(rootDir, {
      force: true,
      recursive: true,
    })
  }

  return {
    cleanup,
    createVariant: writeVariant,
  }
}
