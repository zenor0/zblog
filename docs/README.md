# ZBlog Project Documentation

This directory is the maintained documentation set for ZBlog. It records the current design and architecture decisions that should guide future implementation work.

## Frontend and Design

- [Frontend design system](./design/frontend-design-system.md): public-site visual language, homepage and article design principles, tokens, components, and interaction rules.
- [Article layout](./design/article-layout.md): article design presets, typography controls, layout tokens, and the article layout lab.
- [Markdown rendering](./frontend/markdown-rendering.md): supported article Markdown syntax, renderer pipeline, citations, callouts, article references, code blocks, and whitelisted components.
- [Footer](./frontend/footer.md): Payload footer schema, link resolution, normalization, frontend layout styles, and fallback behavior.

## Content and Admin

- [Post editor](./admin/post-editor.md): Payload post edit information architecture, overview dashboard, translation management, SEO, and admin safety rules.
- [Bibliography](./content/bibliography.md): embedded post bibliography model, BibTeX source rules, validation, import behavior, and frontend rendering.
- [Localization](./content/localization.md): canonical locales, public URL slugs, middleware negotiation, localized content fields, and locale expansion checklist.

## Development References

- [Design labs](./development/design-labs.md): `/dev` reference pages for design-system review, article block previews, article layout, article progress, and footer layout experiments.

## Maintenance Rules

- Keep these docs aligned with the code in `src/` and targeted tests in `tests/`.
- Prefer behavior-level decisions over step-by-step implementation history.
- Do not add generated execution checklists, local absolute paths, or branch-specific notes to this directory.
