# Code Layout

ZBlog now follows a hybrid layout:

- Keep framework entrypoints in `src/app`, `src/collections`, `src/globals`, `src/hooks`, and `src/endpoints`.
- Put business logic in `src/features/<feature>`.
- Put cross-feature primitives in `src/shared`.

## Directory Roles

- `src/app/**`: Next.js routes, metadata, request/response adaptation, page composition.
- `src/features/article/**`: Markdown rendering, article design, citations, bibliography, dev article references.
- `src/features/posts/**`: post queries, preview helpers, post import, post-facing UI.
- `src/features/media/**`: media resolution, PDF preview rendering, media server helpers.
- `src/features/post-views/**`: view metrics and dedupe behavior.
- `src/features/site-settings/**`: global site settings resolution, footer/site config helpers.
- `src/features/*/admin/**`: Payload admin implementations owned by that feature.
- `src/shared/**`: auth helpers, locale primitives, payload client bootstrap, runtime paths, common utilities.
- `src/components/ui/**`: shadcn primitives and only shadcn primitives.

## Dependency Rules

- `src/shared/**` must not import `src/features/**` or `src/app/**`.
- `src/features/**` must not import `src/app/**`.
- Framework entrypoints may depend on `features` and `shared`, but should stay thin.
- New cross-feature code goes into `shared` only when it is not domain-specific.

## Migration Rules

- Move implementation files into `features` or `shared` and update every caller to the new path.
- Do not keep compatibility wrappers once the repo has been migrated.
- Update high-traffic entrypoints first: route handlers, page loaders, Payload config, and shared server helpers.
- Prefer behavior-preserving moves before semantic refactors.

## Current Layout Notes

- Frontend CSS keeps `src/app/(frontend)/styles.css` as the Tailwind entrypoint, with feature-oriented imports under `src/styles/frontend`.
- Payload component path strings should point directly at `src/features/*/admin/**`.
- `src/lib` is no longer an active module layer.
- Do not reintroduce `src/components/frontend/*`, `src/components/payload/*`, or `src/lib/*`.
