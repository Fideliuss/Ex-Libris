import { describe, expect, it } from 'vitest'
import { describeError } from './errors'

const NETWORK = 'Impossible de contacter le serveur. Vérifie ta connexion et réessaie.'
const FORBIDDEN = "Tu n'as pas le droit d'effectuer cette action."

describe('describeError', () => {
  it('explains a network failure, whichever browser wording it comes in', () => {
    expect(describeError(new Error('Failed to fetch'))).toBe(NETWORK)
    expect(describeError(new Error('NetworkError when attempting to fetch resource.'))).toBe(NETWORK)
    expect(describeError(new Error('Load failed'))).toBe(NETWORK)
  })

  it('does not depend on the letter case of the message', () => {
    expect(describeError({ message: 'FAILED TO FETCH' })).toBe(NETWORK)
  })

  it('explains a refusal by the database rules', () => {
    expect(
      describeError({ message: 'new row violates row-level security policy for table "books"' }),
    ).toBe(FORBIDDEN)
    expect(describeError({ message: 'permission denied for table profiles' })).toBe(FORBIDDEN)
  })

  it('keeps the original message for any other error', () => {
    expect(describeError(new Error('duplicate key value'))).toBe(
      'Une erreur est survenue : duplicate key value',
    )
  })

  it('accepts a plain string, null and undefined', () => {
    expect(describeError('boom')).toBe('Une erreur est survenue : boom')
    expect(describeError(null)).toBe('Une erreur est survenue : null')
    expect(describeError(undefined)).toBe('Une erreur est survenue : undefined')
  })
})
