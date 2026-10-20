import { describe, expect, it } from 'vitest'
import { readEmailLink } from './useCloudSync'

describe('readEmailLink', () => {
  it('liest Schlüssel und Art aus dem Anmeldelink', () => {
    const link =
      'https://abc.supabase.co/auth/v1/verify?token=pkce_123abc&type=magiclink&redirect_to=https://daylist-l4uchz3l0t.netlify.app/'
    expect(readEmailLink(link)).toEqual({ tokenHash: 'pkce_123abc', type: 'magiclink' })
  })

  it('erkennt auch den Link aus der ersten Anmelde-E-Mail', () => {
    expect(readEmailLink(' https://abc.supabase.co/auth/v1/verify?token=xyz&type=signup ')).toEqual({
      tokenHash: 'xyz',
      type: 'signup',
    })
  })

  it('gibt bei einem Code oder anderem Text nichts zurück', () => {
    expect(readEmailLink('123456')).toBeNull()
    expect(readEmailLink('https://example.com/irgendwas')).toBeNull()
    expect(readEmailLink('https://abc.supabase.co/auth/v1/verify?token=x&type=unbekannt')).toBeNull()
  })
})
