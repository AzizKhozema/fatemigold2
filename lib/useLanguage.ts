'use client'

import { useState, useEffect } from 'react'
import type { Language } from './i18n'

export function useLanguage() {
  const [lang, setLang] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('fatemi_lang') as Language | null
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'en' || saved === 'ur') setLang(saved)
  }, [])

  const toggleLang = () => {
    const next: Language = lang === 'en' ? 'ur' : 'en'
    setLang(next)
    localStorage.setItem('fatemi_lang', next)
  }

  const isUrdu = lang === 'ur'

  return { lang, toggleLang, isUrdu }
}