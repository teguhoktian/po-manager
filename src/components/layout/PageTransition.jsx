import { useLocation } from 'react-router-dom'

/** Gives each new route a short fade + rise (restarts when the path changes). */
export function PageTransition({ children }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  )
}
