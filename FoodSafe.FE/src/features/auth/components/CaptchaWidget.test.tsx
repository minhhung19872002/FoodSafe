import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CaptchaWidget } from './CaptchaWidget'

const getMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/axios', () => ({
  api: {
    get: getMock,
  },
}))

interface CapturedOptions {
  sitekey: string
  action: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
}

describe('CaptchaWidget', () => {
  afterEach(() => {
    delete window.turnstile
    getMock.mockReset()
  })

  it('renders Turnstile from server configuration and reports token lifecycle events', async () => {
    let options: CapturedOptions | undefined
    const remove = vi.fn()
    window.turnstile = {
      render: vi.fn((_container: HTMLElement, renderOptions: CapturedOptions) => {
        options = renderOptions
        return 'widget-1'
      }),
      remove,
    }
    getMock.mockResolvedValue({
      data: {
        provider: 'turnstile',
        siteKey: 'public-site-key',
        action: 'login',
      },
    })
    const onTokenChange = vi.fn()

    const { unmount } = render(
      <CaptchaWidget onTokenChange={onTokenChange} resetKey={0} />,
    )

    await waitFor(() => expect(window.turnstile?.render).toHaveBeenCalledOnce())
    expect(getMock).toHaveBeenCalledWith('/security/captcha/config')
    expect(options?.sitekey).toBe('public-site-key')
    expect(options?.action).toBe('login')
    expect(onTokenChange).toHaveBeenCalledWith('')

    act(() => options?.callback('verified-token'))
    expect(onTokenChange).toHaveBeenLastCalledWith('verified-token')

    act(() => options?.['expired-callback']())
    expect(onTokenChange).toHaveBeenLastCalledWith('')

    unmount()
    expect(remove).toHaveBeenCalledWith('widget-1')
  })

  it('fails closed when CAPTCHA configuration cannot be loaded', async () => {
    window.turnstile = {
      render: vi.fn(() => 'widget-1'),
      remove: vi.fn(),
    }
    getMock.mockRejectedValue(new Error('unavailable'))
    const onTokenChange = vi.fn()

    render(<CaptchaWidget onTokenChange={onTokenChange} resetKey={0} />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(window.turnstile.render).not.toHaveBeenCalled()
    expect(onTokenChange).toHaveBeenCalledWith('')
  })
})
