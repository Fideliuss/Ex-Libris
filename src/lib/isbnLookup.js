function cleanIsbn(isbn) {
  return isbn.replace(/[^0-9Xx]/g, '')
}

async function lookupGoogleBooks(isbn) {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
  )
  if (!res.ok) throw new Error('Google Books indisponible')
  const data = await res.json()
  const info = data.items?.[0]?.volumeInfo
  if (!info) return null
  return {
    title: info.title ?? '',
    author: info.authors?.join(', ') ?? '',
    publisher: info.publisher ?? '',
    page_count: info.pageCount ?? null,
    cover_url: info.imageLinks?.thumbnail?.replace('http://', 'https://') ?? '',
    description: info.description ?? '',
  }
}

async function lookupOpenLibrary(isbn) {
  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
  )
  if (!res.ok) throw new Error('Open Library indisponible')
  const data = await res.json()
  const book = data[`ISBN:${isbn}`]
  if (!book) return null
  return {
    title: book.title ?? '',
    author: book.authors?.map((a) => a.name).join(', ') ?? '',
    publisher: book.publishers?.map((p) => p.name).join(', ') ?? '',
    page_count: book.number_of_pages ?? null,
    cover_url: book.cover?.large ?? book.cover?.medium ?? '',
  }
}

function bnfSubfield(datafield, code) {
  const subfields = datafield.getElementsByTagNameNS('*', 'subfield')
  for (const sf of subfields) {
    if (sf.getAttribute('code') === code) return sf.textContent?.trim() ?? ''
  }
  return ''
}

function bnfFields(record, tag) {
  const datafields = record.getElementsByTagNameNS('*', 'datafield')
  return [...datafields].filter((df) => df.getAttribute('tag') === tag)
}

// Le catalogue SRU de la BNF ne fournit ni couverture ni résumé, mais couvre
// bien mieux les éditions françaises (petites maisons, collections type
// Folio) que Google Books/Open Library, qui ratent souvent ces ISBN.
function parseBnfRecord(record) {
  const titleField = bnfFields(record, '200')[0]
  const title = titleField ? bnfSubfield(titleField, 'a') : ''
  if (!title) return null

  let author = titleField ? bnfSubfield(titleField, 'f') : ''
  if (!author) {
    const authorFields = [
      ...bnfFields(record, '700'),
      ...bnfFields(record, '701'),
      ...bnfFields(record, '702'),
    ]
    author = authorFields
      .map((df) =>
        [bnfSubfield(df, 'b'), bnfSubfield(df, 'a')].filter(Boolean).join(' '),
      )
      .filter(Boolean)
      .join(', ')
  }

  const publisherField = bnfFields(record, '210')[0] ?? bnfFields(record, '214')[0]
  const publisher = publisherField ? bnfSubfield(publisherField, 'c') : ''

  const collationField = bnfFields(record, '215')[0]
  const collationText = collationField ? bnfSubfield(collationField, 'a') : ''
  const pageMatch = collationText.match(/(\d+)\s*p\b/i)

  return {
    title,
    author,
    publisher,
    page_count: pageMatch ? Number(pageMatch[1]) : null,
    cover_url: '',
    description: '',
  }
}

async function lookupBnf(isbn) {
  const query = encodeURIComponent(`bib.isbn all "${isbn}"`)
  const res = await fetch(
    `https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&query=${query}&recordSchema=unimarcXchange&maximumRecords=1`,
  )
  if (!res.ok) throw new Error('BNF indisponible')
  const xml = await res.text()
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const record = doc.getElementsByTagNameNS('*', 'record')[0]
  if (!record) return null
  return parseBnfRecord(record)
}

// Cherche un livre par ISBN : Google Books puis Open Library, avec la BNF en
// dernier recours pour les éditions françaises que les deux premiers ratent.
// Retourne null si aucune des trois sources n'a de résultat.
export async function lookupIsbn(rawIsbn) {
  const isbn = cleanIsbn(rawIsbn || '')
  if (!isbn) return null

  try {
    const result = await lookupGoogleBooks(isbn)
    if (result) return result
  } catch {
    // on tente le fallback suivant
  }

  try {
    const result = await lookupOpenLibrary(isbn)
    if (result) return result
  } catch {
    // on tente le fallback suivant
  }

  try {
    return await lookupBnf(isbn)
  } catch {
    return null
  }
}
