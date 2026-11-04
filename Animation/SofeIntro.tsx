'use client'

import { useEffect } from 'react'
import { Poppins } from 'next/font/google'
import { runSofeIntro } from './sofeIntroEngine'
import './sofe-intro.css'

// The wordmark font. Swap for whatever your logo font is.
const poppins = Poppins({ subsets: ['latin'], weight: ['700'], display: 'swap' })

export default function SofeIntro() {
  useEffect(() => {
    // returns a cleanup function
    return runSofeIntro({ fontFamily: poppins.style.fontFamily })
  }, [])

  return null
}
