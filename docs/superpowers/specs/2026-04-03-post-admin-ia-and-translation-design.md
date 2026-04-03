# Post Admin IA and Translation Management Design

## Summary

Refactor the post edit experience in the Payload admin so the default entry point is an overview dashboard, the current `Edit` tab is decomposed into top-level task-oriented tabs, translation management becomes locale-agnostic, and the bibliography editor defaults to a denser, more native Payload admin presentation.

## Goals

- Make the first screen on post edit useful for status checking before editing.
- Reduce cognitive load inside the current `Edit` tab by promoting its major sections to top-level tabs.
- Merge `Managed Resources` into the main editing flow without duplicating resource information.
- Replace the current locale-bound translation action with a single translation management surface for all post locales.
- Simplify structured bibliography editing for large entry sets.
- Align bibliography styling with the default Payload admin aesthetic instead of a custom rounded card treatment.

## Non-Goals

- No change to frontend post rendering.
- No schema change to localized post fields.
- No change to translation provider integration beyond admin UX and existing endpoint inputs.
- No expansion of translation coverage to additional fields such as localized SEO in this iteration.

## Current State

- The post collection uses a top-level `tabs` field with two tabs: `Edit` and `Overview`.
- The `Edit` tab still contains five collapsible sections: `Core Content`, `Assets & References`, `Translation`, `SEO`, and `Managed Resources`.
- The translation UI is exposed only as a header action tied to the active admin locale via `useLocale()`.
- The bibliography field renders a large structured editor where every entry is expanded by default and uses custom pill/button/card styling that stands out from the rest of Payload admin.

## Proposed Information Architecture

Reorder and restructure the post edit tabs as follows:

1. `Overview`
2. `Core Content`
3. `Assets & References`
4. `Translation`
5. `SEO`

### Overview

- Move `Overview` to the first tab position so it becomes the default initial view.
- Keep the existing high-value summary behavior:
  - publishing snapshot
  - locale coverage summary
  - content asset summary
  - owned resource counts
- Treat this tab as read-oriented triage, not as an editing surface.

### Core Content

- Move the main writing fields out of collapsibles into the tab body:
  - `title`
  - `excerpt`
  - `content`
- Merge the `Managed Resources` section into this tab as a lower section, keeping `ownedMedia` as a reverse-linked resource listing.
- Keep the resource listing secondary to the authoring fields so the tab still reads primarily as the writing surface.

### Assets & References

- Move the current `Assets & References` section into its own top-level tab.
- Keep these fields together:
  - `heroImage`
  - `bibliography`
  - `attachments`
- Do not split bibliography into its own top-level tab in this iteration; it remains semantically grouped with article assets and references.

### Translation

- Replace the current collapsible translation field section with a locale management panel.
- This tab is not a multi-locale field editor. It is a post translation control center.
- Each supported locale is displayed as a row or card with:
  - locale label
  - completion count for `title`, `excerpt`, and `content` as `x/3`
  - translation status
  - translated from locale
  - translated at timestamp
  - badges for default locale and active locale where applicable
- Each locale entry exposes:
  - a shortcut to switch the admin edit context to that locale
  - a `Translate from...` action that allows selecting any other supported locale as the source
- Translation actions are target-locale based, not current-locale based. The user can stay on one admin locale and manage every post locale from the same tab.

### SEO

- Move the current SEO collapsible into its own top-level tab.
- Keep the existing localized SEO fields unchanged.
- Do not pull SEO into the translation management surface.

## Translation Management Design

### User Experience

- The translation management panel loads all supported locales for the current post in one server-provided snapshot.
- Completion is computed only from:
  - `title`
  - `excerpt`
  - `content`
- Completion must distinguish:
  - `0/3` for missing
  - `1/3` or `2/3` for partial
  - `3/3` for complete
- The panel should make it obvious which locales are safe translation sources by showing completion and status before the user chooses a source locale.

### Translation Action Flow

1. User opens the action for a target locale.
2. User selects a source locale from the supported locale list, excluding the target locale.
3. User confirms translation.
4. The client calls the existing `/:id/auto-translate` endpoint with explicit `sourceLocale` and `targetLocale`.
5. On success, the panel refreshes and the target locale row updates.

### Endpoint and Data Constraints

- Continue using the existing `autoTranslatePostEndpoint`.
- Keep the existing access and transaction-safe request flow.
- Preserve `overrideAccess: false` for Local API operations.
- Preserve `req` for nested Payload operations.
- Keep server-side validation that source locale must contain at least `title` and `content`.
- The endpoint remains responsible for writing:
  - `title`
  - `excerpt`
  - `content`
  - `translatedAt`
  - `translatedFromLocale`
  - `translationProvider`
  - `translationStatus = machine`

### Component Boundaries

- Keep the existing header action if it is still useful as a shortcut, but remove its dependency on the active locale if retained.
- Introduce a dedicated Payload admin component for the new `Translation` tab.
- Prefer server-side snapshot loading for locale status rows, with client-side controls only where user interaction is required.
- Reuse the existing locale helpers in `src/lib/locales.ts` for labels, normalization, and default locale markers.

## Bibliography Editor Design

### Structured Mode Behavior

- Default every structured bibliography entry to collapsed.
- Each collapsed item shows a lightweight summary:
  - citation key
  - entry type
  - optional title if present
- Expanding an item reveals the existing editable fields and people sections.
- New entries may default to expanded immediately after creation so the user can start editing, but all existing entries should load collapsed by default.

### Visual Style

- Remove the custom rounded pill/card treatment from the bibliography UI.
- Prefer Payload admin primitives and default visual language where possible.
- Keep only layout-oriented SCSS that:
  - manages spacing
  - defines simple grids
  - supports responsive stacking
- Buttons should use Payload `Button` where practical.
- Inputs should avoid strong custom border-radius overrides and custom button skins.

### Fallback and Editability

- Preserve the current raw-versus-structured mode behavior.
- Preserve the existing fallback to raw mode when the bibliography source is not fully editable.
- Do not weaken any validation or parser behavior in order to simplify the UI.

## Testing Strategy

Add or update tests for the following:

1. Post tab configuration
   - `Overview` is the first top-level tab.
   - `Core Content`, `Assets & References`, `Translation`, and `SEO` exist as separate top-level tabs.
   - `Managed Resources` is no longer a separate section under the old `Edit` tab and is represented inside `Core Content`.

2. Translation management panel
   - locale completion is computed correctly for `title`, `excerpt`, and `content`
   - source locale options exclude the target locale
   - translation requests submit explicit `sourceLocale` and `targetLocale`
   - success refreshes displayed locale state

3. Bibliography field behavior
   - structured entries render collapsed by default
   - expanding an entry reveals the editable fields
   - unsupported bibliographies still force raw mode

4. Regression coverage
   - existing `autoTranslatePostEndpoint` validations continue to hold
   - bibliography source validation against citation keys remains unchanged

## Risks and Mitigations

### Risk: Tab promotion makes edit configuration harder to scan in code

Mitigation:
- Keep tab definitions grouped and ordered to match the user-facing IA.
- Use small helper UI components where logic would otherwise bloat `Posts.ts`.

### Risk: Translation management drifts from live document state after an action

Mitigation:
- Refresh the router after successful translation.
- Source all locale summaries from a fresh server snapshot rather than optimistic local mutation only.

### Risk: Bibliography collapse adds extra clicks for tiny bibliographies

Mitigation:
- Show concise per-entry summaries so scanning remains fast.
- Auto-expand newly created entries to reduce friction during creation.

## Implementation Notes

- After schema or admin config changes, regenerate Payload import maps if component paths change.
- If localized field config changes require regenerated types, run the project's type generation script.
- Validate the final implementation with `tsc --noEmit`.

## Acceptance Criteria

- Opening a post in Payload admin lands on `Overview`.
- The old overloaded `Edit` tab no longer exists.
- Core writing, assets/references, translation management, and SEO each have their own top-level tab.
- `Managed Resources` is available from `Core Content`.
- The `Translation` tab allows translating from any supported source locale to any different target locale without requiring the admin locale to be switched first.
- The `Translation` tab shows per-locale completion for `title`, `excerpt`, and `content`.
- Structured bibliography entries load collapsed by default.
- The bibliography editor no longer uses the current heavy custom rounded styling and feels visually consistent with the rest of Payload admin.
