import type { ReactNode } from 'react'

import type { UtilityPageCopy } from '@/features/utility-pages/model/utility-pages'

export function UtilityPageShell(props: { children?: ReactNode; copy: UtilityPageCopy }) {
  return (
    <div className="page-frame frontend-shell" data-utility-page="">
      <header className="grid gap-4 border-b border-border pb-10" data-utility-page-header="">
        <p className="section-kicker">{props.copy.eyebrow}</p>
        <div className="grid gap-4">
          <h1 className="max-w-4xl font-serif text-4xl leading-tight sm:text-5xl">
            {props.copy.title}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-foreground/72">
            {props.copy.description}
          </p>
          {props.copy.effectiveDateLabel ? (
            <p className="editorial-meta">{props.copy.effectiveDateLabel}</p>
          ) : null}
        </div>
      </header>

      {props.children ? <div className="py-10">{props.children}</div> : null}

      {props.copy.sections.length ? (
        <div className="grid gap-8 py-10" data-utility-page-sections="">
          {props.copy.sections.map((section) => (
            <section className="grid max-w-3xl gap-3" key={section.title}>
              <h2 className="font-serif text-2xl leading-tight">{section.title}</h2>
              <div className="grid gap-4 text-base leading-8 text-foreground/72">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  )
}
