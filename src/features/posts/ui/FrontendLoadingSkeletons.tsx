import { Skeleton } from '@/components/ui/skeleton'

const postRows = [0, 1, 2]
const paragraphRows = [0, 1, 2, 3]
const tocRows = [0, 1, 2, 3, 4]

export function HomePageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading content"
      className="page-frame frontend-shell"
      data-frontend-loading="home"
    >
      <header className="grid gap-4 border-b border-border pb-12">
        <div className="flex max-w-4xl flex-col gap-4">
          <Skeleton className="h-3 w-28" />
          <div className="flex max-w-4xl flex-col gap-3">
            <Skeleton className="h-12 w-full max-w-3xl" />
            <Skeleton className="h-12 w-3/4 max-w-2xl" />
          </div>
          <div className="flex max-w-2xl flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </header>

      <article className="grid gap-6 border-b border-border py-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-full max-w-2xl" />
            <Skeleton className="h-9 w-2/3 max-w-xl" />
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-4 w-4/5 max-w-xl" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <Skeleton className="aspect-[4/3] w-full rounded-none" />
      </article>

      <section className="grid gap-7 border-b border-border py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="grid gap-0">
          {[0, 1].map((row) => (
            <article
              className="grid gap-3 border-b border-border py-5 md:grid-cols-[minmax(0,1fr)_11rem]"
              key={row}
            >
              <div className="grid gap-2">
                <Skeleton className="h-6 w-full max-w-md" />
                <Skeleton className="h-4 w-full max-w-2xl" />
                <Skeleton className="h-4 w-4/5 max-w-xl" />
              </div>
              <div className="grid gap-2 md:justify-items-end">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 pt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-36" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>

        <div className="flex flex-col">
          {postRows.map((row) => (
            <article
              className="grid gap-5 border-b border-border py-7 md:grid-cols-[minmax(0,1fr)_14rem] md:items-start"
              key={row}
            >
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-full max-w-xl" />
                  <Skeleton className="h-6 w-2/3 max-w-md" />
                  <Skeleton className="h-4 w-full max-w-2xl" />
                  <Skeleton className="h-4 w-4/5 max-w-xl" />
                </div>
              </div>
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export function PostArticleSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading article"
      className="page-frame frontend-shell"
      data-frontend-loading="article"
    >
      <div className="mb-8 border-b border-border pb-5" data-embedded-hidden="true">
        <Skeleton className="h-4 w-28" />
      </div>

      <article
        className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-10"
        data-article-layout=""
      >
        <div className="flex min-w-0 flex-col gap-8" data-article-reading-column="">
          <header
            className="flex flex-col gap-6 border-b border-border pb-10"
            data-article-frontmatter=""
          >
            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>

            <div className="flex flex-col gap-4">
              <Skeleton className="h-3 w-24" />
              <div className="flex max-w-4xl flex-col gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-5/6" />
              </div>
              <div className="flex max-w-3xl flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </header>

          <figure className="flex flex-col gap-3 border-b border-border pb-10">
            <Skeleton className="aspect-[16/9] w-full rounded-none" />
            <div className="grid gap-x-4 gap-y-1 px-1 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Skeleton className="h-3 w-full max-w-lg" />
              <Skeleton className="h-3 w-24 sm:justify-self-end" />
            </div>
          </figure>

          <section
            className="article-copy flex flex-col gap-5"
            data-article-body=""
            data-post-reading-root=""
          >
            {paragraphRows.map((row) => (
              <div className="flex flex-col gap-2" key={row}>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
            <Skeleton className="aspect-[5/2] w-full rounded-none" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </section>
        </div>

        <aside className="hidden xl:block xl:sticky xl:top-8 xl:self-start">
          <section className="flex min-w-0 flex-col gap-4 border-l border-border pl-6">
            <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
              <div className="flex min-w-0 flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="flex flex-col gap-2">
              {tocRows.map((row) => (
                <Skeleton className="h-4 w-full" key={row} />
              ))}
            </div>
          </section>
        </aside>
      </article>
    </div>
  )
}
