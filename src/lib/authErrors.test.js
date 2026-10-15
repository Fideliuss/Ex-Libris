import { describe, expect, it } from 'vitest'
import { describeSignInError, describeSignUpError, isClockSkewError } from './authErrors'

describe('describeSignInError', () => {
  it('explains an unconfirmed account without pointing at the admin console', () => {
    const text = describeSignInError({ code: 'email_not_confirmed' })
    expect(text).toMatch(/pas encore confirmé/)
    expect(text).not.toMatch(/Supabase|Authentication/)
  })

  it('maps bad credentials', () => {
    expect(describeSignInError({ message: 'Invalid login credentials' })).toBe(
      'Email ou mot de passe incorrect.',
    )
  })

  it('maps a clock skew error to a refresh hint', () => {
    const error = { message: 'JWT issued at future' }
    expect(isClockSkewError(error)).toBe(true)
    expect(describeSignInError(error)).toMatch(/Rafraîchis/)
  })

  it('falls back to the raw message', () => {
    expect(describeSignInError({ message: 'boom' })).toBe('Connexion impossible : boom.')
  })
})

describe('describeSignUpError', () => {
  it('detects an existing account and a weak password', () => {
    expect(describeSignUpError({ code: 'user_already_exists' })).toMatch(/existe déjà/)
    expect(describeSignUpError({ message: 'Password should be longer' })).toMatch(/trop faible/)
  })
})
