# ZBlog

ZBlog is a self-hostable publishing site for articles, notes, and project
updates. It is designed around a quiet reading experience, practical authoring
tools, seeded demo content, and a simple path from local development to a
single-server deployment.

## Preview

![ZBlog home page](./docs/assets/readme/home.png)

<details>
<summary>More screenshots</summary>

### Posts

![ZBlog posts page](./docs/assets/readme/posts.png)

### Article

![ZBlog article page](./docs/assets/readme/article.png)

</details>

## Highlights

- Public pages for posts, projects, archive, about, RSS, and utility content.
- Admin workspace for writing, media, previews, and site configuration.
- Markdown-centered article workflow with citations, attachments, and revision history.
- Local-first setup with seed content for development and screenshots.
- Docker Compose deployment for a small self-hosted instance.

## Getting Started

```bash
pnpm install
cp .env.example .env
```

For local development, use SQLite and local runtime state:

```bash
DATABASE_URL=file:.data/zblog.db
ZBLOG_STATE_DIR=.data
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYLOAD_SECRET=replace-with-a-long-random-secret
```

Seed demo content and start the app:

```bash
pnpm run seed:blog:fresh
pnpm dev
```

Open `http://localhost:3000` for the site and `http://localhost:3000/admin`
for the admin area.

## Deployment

The included Docker Compose setup runs the app with SQLite and local filesystem
storage.

```bash
cp .env.example .env
# edit PAYLOAD_SECRET and NEXT_PUBLIC_SITE_URL
docker compose up -d --build
```

Back up the `zblog-data` Docker volume to preserve the database, uploads,
generated previews, and import/export files.

## Documentation

- [Project documentation](./docs/README.md)
- Local reset: `pnpm run db:reset`
- Type check: `pnpm exec tsc --noEmit`
- Tests: `pnpm run test:int` and `pnpm run test:e2e`
