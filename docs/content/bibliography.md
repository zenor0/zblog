# Bibliography Model

## Purpose

Each post owns its own bibliography. The bibliography is stored directly on the post as BibTeX source so citations, imports, previews, and admin editing all use one canonical value.

The source of truth is the `bibliography` group on `posts`.

## Data Model

The post document stores:

- `bibliography.filename`: optional original filename for the uploaded or imported `.bib` source
- `bibliography.source`: optional BibTeX text, required when the current locale content cites bibliography keys

Both fields are non-localized. All locales of a post share the same bibliography source.

The project does not use a standalone bibliography collection and does not support sharing one bibliography across multiple posts.

## Canonical Source

`bibliography.source` is the only persisted bibliography body. Structured admin editing is a view over this text, not a second stored data model.

Raw BibTeX mode must always remain available because it is the safe fallback for:

- uncommon BibTeX entry types
- fields that cannot be round-tripped safely
- parse failures or ambiguous source formatting
- advanced hand-authored bibliography files

Structured mode may support common entry types and fields, but it must serialize back to BibTeX before saving.

## Validation

Post save validation runs against the current locale content body.

Rules:

- If content has no bibliography citations, bibliography source may be empty.
- If content contains `[@key]` citations and there is no bibliography source, save fails.
- If the source cannot be parsed well enough to extract citation keys, save fails through bibliography loading.
- If parsed keys do not include every cited key, save fails with the missing citation keys.

Article-element references such as `[@fig:overview]` and `[@tbl:benchmark]` are not bibliography keys.

## Rendering Flow

Server-side post loading reads `post.bibliography.source`, parses entries, and resolves only the entries referenced by the rendered locale body.

The frontend article receives:

- resolved bibliography entries
- citation numbering
- link preview data for citations
- missing citation diagnostics

The article renderer should not know whether bibliography text came from upload, raw paste, package import, or structured editing.

## Package Import

Package import writes bibliography content directly into the post:

- incoming `.bib` text becomes `post.bibliography.source`
- incoming filename becomes `post.bibliography.filename`
- no reusable bibliography document is created
- packages with citation keys but no bibliography source are invalid

This keeps imported content ownership aligned with the post lifecycle.

## Admin Experience

The bibliography editor belongs in the post `Assets & References` tab.

Required behavior:

- paste or edit raw BibTeX
- load `.bib` file contents into the current post
- show parse feedback
- offer structured editing only when entries can be safely represented
- default existing structured entries to a collapsed, scan-friendly view
- keep styling close to Payload admin defaults

## Verification

Use targeted coverage for:

- missing bibliography source when content cites keys
- invalid BibTeX source
- missing cited keys
- successful citation rendering from embedded source
- package import writing embedded bibliography fields
- structured editor round-trip for supported entries
- raw-mode fallback for unsupported source
