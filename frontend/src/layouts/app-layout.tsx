import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Container } from '../components/design-system'
import { useI18n } from '../lib/i18n'
import { MobileNavDrawer } from './mobile-nav-drawer'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppLayout() {
  const { t } = useI18n()
  const location = useLocation()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isMobileNavOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false)
        mobileMenuButtonRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileNavOpen])

  const closeMobileNav = () => {
    setIsMobileNavOpen(false)
    mobileMenuButtonRef.current?.focus()
  }

  const toggleMobileNav = () => {
    setIsMobileNavOpen((current) => !current)
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <MobileNavDrawer isOpen={isMobileNavOpen} onClose={closeMobileNav} />

      <Container className="flex min-h-screen !px-0">
        <Sidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar
            isMobileNavOpen={isMobileNavOpen}
            onToggleMobileNav={toggleMobileNav}
            mobileMenuButtonRef={mobileMenuButtonRef}
          />
          <main className="flex-1 bg-background px-4 py-6 md:px-8 md:py-8" aria-label={t('shell.mainContentAriaLabel')}>
            <Outlet />
          </main>
        </div>
      </Container>
    </div>
  )
}
