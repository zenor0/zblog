import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { zipSync, strToU8 } from 'fflate'

type PackageVariant = {
  bodyAppendix?: string
  enTitle: string
  slug: string
  zhTitle: string
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
  <rect x="154" y="180" width="360" height="24" rx="12" fill="#201d18" opacity="0.1"/>
  <rect x="154" y="232" width="780" height="16" rx="8" fill="#201d18" opacity="0.08"/>
  <rect x="154" y="272" width="720" height="16" rx="8" fill="#201d18" opacity="0.08"/>
  <circle cx="914" cy="304" r="112" fill="#d97e56" opacity="0.92"/>
  <text x="154" y="432" font-family="Georgia, serif" font-size="72" fill="#201d18">Imported post package</text>
</svg>
`

const attachmentText = `Imported package attachment

This file exists to verify automated asset upload and attachment linking.
`

function buildZhMarkdown(variant: PackageVariant) {
  return `---
title: ${variant.zhTitle}
slug: ${variant.slug}
locale: zh-Hans
status: published
excerpt: 用于验证整包导入、引用处理、媒体上传和版本历史。
tags:
  - import
  - package
heroImage: media/hero.svg
attachments:
  - file: media/notes.txt
    label: 导入包附件
    description: 用于验证自动附件映射。
bibliography: refs/references.bib
bibliographyTitle: 导入包参考文献
---
# ${variant.zhTitle}

这篇文章来自一个 ZIP 包导入流程，并包含一个引用 [@doe2025]。

![导入头图](media/hero.svg)

${variant.bodyAppendix ?? ''}
`
}

function buildEnMarkdown(variant: PackageVariant) {
  return `---
title: ${variant.enTitle}
slug: ${variant.slug}
locale: en
translationStatus: reviewed
translatedFromLocale: zh-Hans
translationProvider: package-import
---
# ${variant.enTitle}

This locale was imported from the same ZIP bundle and cites [@doe2025].

![Imported hero](media/hero.svg)
`
}

export async function createPostPackageFiles() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zblog-test-package-'))

  async function writeVariant(fileName: string, variant: PackageVariant) {
    const archiveBytes = zipSync({
      'zh-hans.md': strToU8(buildZhMarkdown(variant)),
      'en.md': strToU8(buildEnMarkdown(variant)),
      'media/hero.svg': strToU8(heroSvg),
      'media/notes.txt': strToU8(attachmentText),
      'refs/references.bib': strToU8(bibliographySource),
    })
    const filePath = path.join(tempDir, fileName)

    await fs.writeFile(filePath, Buffer.from(archiveBytes))

    return filePath
  }

  async function cleanup() {
    await fs.rm(tempDir, {
      force: true,
      recursive: true,
    })
  }

  return {
    cleanup,
    createVariant: writeVariant,
  }
}
