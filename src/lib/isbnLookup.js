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

// Cherche un livre par ISBN : Google Books en priorité, Open Library en repli.
// Retourne null si aucune des deux sources n'a de résultat.
export async function lookupIsbn(rawIsbn) {
  const isbn = cleanIsbn(rawIsbn || '')
  if (!isbn) return null

  try {
    const result = await lookupGoogleBooks(isbn)
    if (result) return result
  } catch {
    // on tente le fallback ci-dessous
  }

  try {
    return await lookupOpenLibrary(isbn)
  } catch {
    return null
  }
}
