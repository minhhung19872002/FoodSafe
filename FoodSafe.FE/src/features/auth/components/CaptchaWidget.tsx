import { useEffect, useRef, useState } from 'react'
import { Alert, Spin } from 'antd'
import { api } from '@/lib/axios'
import type { CaptchaConfig } from '../types/auth.types'

interface TurnstileRenderOptions {
  sitekey: string
  action: string
  theme: 'auto'
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<void> | undefined

function loadTurnstile(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve()
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-foodsafe-turnstile]',
      )
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener(
          'error',
          () => reject(new Error('Turnstile load failed')),
          { once: true },
        )
        return
      }

      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.foodsafeTurnstile = 'true'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Turnstile load failed'))
      document.head.appendChild(script)
    })
  }

  return scriptPromise
}

interface CaptchaWidgetProps {
  onTokenChange: (token: string) => void
  resetKey: number
}

export function CaptchaWidget({ onTokenChange, resetKey }: CaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    onTokenChange('')
    setLoading(true)
    setFailed(false)

    Promise.all([
      api.get<CaptchaConfig>('/security/captcha/config').then((response) => response.data),
      loadTurnstile(),
    ])
      .then(([config]) => {
        if (cancelled || !containerRef.current || !window.turnstile) {
          return
        }

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current)
        }
        containerRef.current.replaceChildren()
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: config.siteKey,
          action: config.action,
          theme: 'auto',
          callback: (token) => onTokenChange(token),
          'expired-callback': () => onTokenChange(''),
          'error-callback': () => {
            onTokenChange('')
            setFailed(true)
          },
        })
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false)
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = undefined
      }
    }
  }, [onTokenChange, resetKey])

  return (
    <div>
      {loading && <Spin size="small" />}
      {failed && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải xác minh CAPTCHA. Vui lòng tải lại trang."
        />
      )}
      <div ref={containerRef} />
    </div>
  )
}
