import { useCallback, useEffect, useState } from 'react'
import LandingPage from './LandingPage'
import SignApp from './SignApp'

function resolveRoute(): string {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return path === '/app' ? '/app' : '/'
}

function App() {
  const [route, setRoute] = useState<string>(() => resolveRoute())

  useEffect(() => {
    const onPop = () => setRoute(resolveRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to: string) => {
    window.history.pushState({}, '', to)
    setRoute(resolveRoute())
  }, [])

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      {route === '/app' ? <SignApp /> : <LandingPage onNavigate={navigate} />}
    </>
  )
}

export default App
