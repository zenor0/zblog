declare module 'bibtex-parse-js' {
  export type BibtexEntry = {
    citationKey?: string
    entryType?: string
    entryTags?: Record<string, string>
  }

  const bibtexParse: {
    toJSON(input: string): BibtexEntry[]
  }

  export default bibtexParse
}
