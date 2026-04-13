import { useState, useEffect } from 'react'

// Wrapper for components that can't be prerendered safely (e.g. Google Maps,
// which mutates DOM in ways that don't match between prerender and hydration).
// During the prerender pass (window.__PRERENDER__ === true) or on the first
// client render, renders nothing. After mount, renders children.
export default function ClientOnly({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.__PRERENDER__) return
    setMounted(true)
  }, [])

  if (!mounted) return fallback
  return children
}
