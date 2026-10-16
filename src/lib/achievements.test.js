import { describe, expect, it } from 'vitest'
import { evaluateAchievements } from './achievements'

// Jeu de livres couvrant les cas limites des succès : séries avec et sans
// trou, dates mixtes (date seule / horodatage), types variés, éditions
// spéciales, tags, univers, auteurs multiples. Sert de test de
// caractérisation : toute refonte de achievements.js doit laisser la sortie
// strictement identique.
function makeBooks() {
  const books = []
  const types = ['book', 'bd', 'comics', 'manga']
  for (let i = 0; i < 60; i += 1) {
    const day = String((i % 28) + 1).padStart(2, '0')
    const month = String((i % 12) + 1).padStart(2, '0')
    const year = 2022 + Math.floor(i / 24)
    const finished = `${year}-${month}-${day}`
    const read = i % 3 !== 2
    books.push({
      id: `b${i}`,
      title: `Livre ${i}`,
      type: types[i % 4],
      status: read ? 'read' : i % 2 ? 'to-read' : 'wishlist',
      author: [`Auteur ${i % 17}`, ...(i % 5 === 0 ? [`Co ${i % 4}`] : [])],
      publisher: `Editeur ${i % 7}`,
      universe: i % 9 === 0 ? `Univers ${i % 3}` : null,
      series: i % 10 < 4 ? `Serie ${i % 3}` : null,
      series_index: i % 10 < 4 ? Math.floor(i / 10) * 2 + (i % 10) : null,
      tags: [`tag${i % 20}`, `tag${(i * 3) % 20}`],
      edition: i % 11 === 0 ? ['Collector'] : [],
      rating: read ? (i % 6) + (i % 2 ? 0.5 : 0) : null,
      page_count: i % 13 === 0 ? 600 : 250,
      translator: i % 8 === 0 ? ['Traducteur'] : null,
      illustrator: i % 14 === 0 ? ['Illustrateur'] : null,
      favorite_quote: i % 19 === 0 ? 'Une citation' : null,
      date_started: read ? `${year}-${month}-${String(Math.max(1, Number(day) - (i % 4))).padStart(2, '0')}` : null,
      date_finished: read ? finished : null,
      created_at: `${year}-${month}-${day}T10:00:00+00:00`,
    })
  }
  return books
}

// unlockedAtForRank est une fonction : on la déplie pour chaque rang afin
// que la sortie soit sérialisable et comparable.
function plain(badges) {
  return badges.map((b) => {
    if (b.kind !== 'tiered') return b
    const { unlockedAtForRank, ...rest } = b
    return {
      ...rest,
      dates: b.thresholds.map((_, rank) => unlockedAtForRank(rank)),
    }
  })
}

describe('evaluateAchievements', () => {
  it('ne débloque rien sur une bibliothèque vide', () => {
    const badges = evaluateAchievements([], {})
    for (const badge of badges) {
      if (badge.kind === 'tiered') expect(badge.reachedRank).toBe(-1)
      else expect(badge.unlocked).toBe(false)
    }
  })

  it('produit le même résultat sur le jeu de référence (sans foyer)', () => {
    expect(plain(evaluateAchievements(makeBooks(), {}))).toMatchSnapshot()
  })

  it('produit le même résultat sur le jeu de référence (avec foyer)', () => {
    expect(plain(evaluateAchievements(makeBooks(), { partner: true }))).toMatchSnapshot()
  })

  it('reconnait les séries sans lacune', () => {
    const books = [1, 2, 3].map((n) => ({
      id: `s${n}`,
      title: `T${n}`,
      series: 'S',
      series_index: n,
      created_at: `2024-01-0${n}T00:00:00+00:00`,
    }))
    const badge = evaluateAchievements(books, {}).find((b) => b.id === 'series-sine-lacuna')
    expect(badge.unlocked).toBe(true)
    expect(badge.unlockedAt).toBe('2024-01-03T00:00:00+00:00')
  })
})
