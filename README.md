# ZBlog

ZBlog is a Payload-backed bilingual blog built with Next.js.

## Quick Start - local setup

To spin up this template locally, follow these steps:

### Clone

After you click the `Deploy` button above, you'll want to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

### Development

1. First [clone the repo](#clone) if you have not done so already
2. `cd my-project && cp .env.example .env` to copy the example environment variables.
3. If you are running without Docker, set `DATABASE_URL=file:.data/zblog.db` and `ZBLOG_STATE_DIR=.data` in `.env`.
4. `pnpm install && pnpm dev` to install dependencies and start the dev server
5. open `http://localhost:3000` to open the app in your browser

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user.

## Production Docker

The production Docker setup is self-contained and does not require managed cloud services. It runs one Next.js/Payload app container, uses SQLite for the database, stores uploads on the local filesystem, and exposes port `3000` for your own reverse proxy or server panel.

Required host dependencies:

- Docker Engine
- Docker Compose

Required runtime configuration:

- `PAYLOAD_SECRET`: set this to a long random string before first production use.
- `NEXT_PUBLIC_SITE_URL`: set this to the public origin, for example `https://blog.example.com`.
- `DATABASE_URL`: keep `file:/app/.data/zblog.db` for the bundled SQLite deployment.
- `ZBLOG_STATE_DIR`: keep `/app/.data` so the database, uploads, previews, and import/export files are stored in the persistent Docker volume.

Run the production app:

```bash
cp .env.example .env
# edit PAYLOAD_SECRET and NEXT_PUBLIC_SITE_URL
docker compose up -d --build
```

Then open `http://localhost:3000/admin` or point your reverse proxy at `http://127.0.0.1:3000`.

The persistent state lives in the `zblog-data` Docker volume mounted at `/app/.data`. Back up that volume to preserve:

- SQLite database: `zblog.db`
- media uploads: `media/`
- generated PDF previews: `media-previews/`
- site data imports and exports: `imports/`, `exports/`
- seed assets: `seed-assets/`

PDF preview rendering is local. The Docker image installs `poppler-utils` and uses `pdftocairo` by default. Automatic translation is optional and disabled unless `TRANSLATION_API_URL` is configured.

## Project docs

- [Project documentation](./docs/README.md): frontend design system, article layout, Markdown rendering, post editor IA, bibliography, footer, localization, and development labs.
- Runtime state: Docker production stores state under `/app/.data`; host-local development should use `.data`.
- Local reset: this app is still pre-launch, so local data is disposable. Use `pnpm run db:reset` to remove `.data`, or `pnpm run seed:blog:fresh` to reset and recreate the seeded blog content.
- Seed profiling: set `ZBLOG_SEED_TIMING=true` when running `seed:blog` to print per-step timings. Most cold-start time is Payload config and SQLite schema initialization; the seed writes are intentionally small.

## How it works

The Payload config is tailored for a bilingual editorial blog. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Media

  This is the uploads enabled collection. It features pre-configured sizes, focal point and manual resizing to help you manage your pictures.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
