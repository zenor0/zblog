# Design Labs

## Purpose

Development reference pages under `/dev` provide isolated, non-indexed surfaces for validating design decisions before they become production patterns.

The registry is defined in `src/lib/dev-reference.ts`.

## Foundation References

### `/dev/design-system`

The design system page is the primary visual reference for the public frontend. It documents and previews:

- color semantics
- typography scale
- component treatment
- layout and motion principles
- article block entry points

Use it when adding a new frontend page or component that should match the public-site design language.

### `/dev/design-system/article-blocks`

The article block matrix statically enumerates Markdown and article component states.

It covers:

- paragraphs and headings
- lists and blockquotes
- GitHub-style callouts
- media and figures
- tables
- code blocks
- citation links
- `NoticeCard`
- `FeatureGrid`

These samples are intentionally static so visual regressions can be reviewed without depending on a full Markdown render path.

## Experiments

### `/dev/article-layout`

The article layout lab renders production-shaped `PostArticle` demo content. Use it to compare article typography, spacing, rich block rhythm, media surfaces, and table-of-contents behavior.

This lab is the preferred place to evaluate changes to article design tokens.

### `/dev/article-progress`

The article progress lab isolates reading-progress and table-of-contents interactions. Use it for scroll measurement, active heading behavior, and long-article navigation experiments.

### `/dev/footer-layouts`

The footer layout lab compares footer layout styles:

- compact record
- directory
- compliance ledger

Use it to evaluate how brand, links, contact information, legal links, copyright, filings, and low-frequency metadata behave across footer configurations.

## Rules

- `/dev` pages must be marked non-indexed.
- Labs should reuse production components when the goal is to validate production behavior.
- Static preview matrices should be used when the goal is to isolate visual states.
- Experiments should graduate into documented production patterns or be removed when obsolete.
- Keep the registry and tests updated when adding, renaming, or deleting a lab.
