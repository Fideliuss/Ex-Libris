import { describe, expect, it } from 'vitest'
import { formatAppVersion } from './appVersion'

describe('formatAppVersion', () => {
  it('shows the version and the short commit when both are known', () => {
    expect(formatAppVersion('1.12.2', '48c81a2')).toBe('v1.12.2 (48c81a2)')
  })

  it('shows only the version for a local build without commit', () => {
    expect(formatAppVersion('1.12.2', '')).toBe('v1.12.2')
  })

  it('shows "dev" when no version was injected', () => {
    expect(formatAppVersion('dev', '')).toBe('dev')
  })
})
