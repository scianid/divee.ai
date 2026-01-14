import React, { useEffect, useMemo, useRef, useState } from 'react'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mediaQuery.matches)
    update()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update)
      return () => mediaQuery.removeEventListener('change', update)
    }

    // Safari fallback
    mediaQuery.addListener(update)
    return () => mediaQuery.removeListener(update)
  }, [])

  return reduced
}

type UseInViewOptions = {
  rootMargin?: string
  threshold?: number | number[]
  once?: boolean
}

function useInView<T extends Element>({ rootMargin, threshold, once = true }: UseInViewOptions) {
  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  const observerOptions = useMemo(() => {
    return {
      root: null,
      rootMargin: rootMargin ?? '0px 0px -12% 0px',
      threshold: threshold ?? 0.15,
    } as IntersectionObserverInit
  }, [rootMargin, threshold])

  useEffect(() => {
    if (reducedMotion) {
      setIsVisible(true)
      return
    }

    const el = ref.current
    if (!el) return
    if (isVisible && once) return

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setIsVisible(false)
        }
      }
    }, observerOptions)

    observer.observe(el)
    return () => observer.disconnect()
  }, [observerOptions, once, reducedMotion, isVisible])

  return { ref, isVisible }
}

type RevealProps<T extends keyof JSX.IntrinsicElements> = {
  as?: T
  delay?: number
  className?: string
  once?: boolean
  rootMargin?: string
  threshold?: number | number[]
} & Omit<JSX.IntrinsicElements[T], 'ref'>

export function Reveal<T extends keyof JSX.IntrinsicElements = 'div'>(props: RevealProps<T>) {
  const {
    as,
    delay = 0,
    className,
    once,
    rootMargin,
    threshold,
    style,
    children,
    ...rest
  } = props

  const Tag = (as ?? 'div') as keyof JSX.IntrinsicElements
  const { ref, isVisible } = useInView<Element>({ rootMargin, threshold, once: once ?? true })

  const mergedStyle = {
    ...(style as React.CSSProperties),
    ['--reveal-delay' as any]: `${delay}ms`,
  } as React.CSSProperties & { ['--reveal-delay']?: string }

  return (
    <Tag
      ref={ref as any}
      className={['reveal', isVisible ? 'is-visible' : '', className ?? ''].filter(Boolean).join(' ')}
      style={mergedStyle}
      {...(rest as any)}
    >
      {children}
    </Tag>
  )
}