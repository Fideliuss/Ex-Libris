import { describe, expect, it } from 'vitest'
import { validateNewPassword } from './passwordRules'

describe('validateNewPassword', () => {
  it('rejects a short password first, then a mismatch', () => {
    expect(validateNewPassword('abc', 'abc')).toMatch(/au moins 6/)
    expect(validateNewPassword('abcdef', 'abcdeg')).toMatch(/ne correspondent pas/)
  })

  it('accepts a long enough matching password', () => {
    expect(validateNewPassword('abcdef', 'abcdef')).toBeNull()
  })
})
