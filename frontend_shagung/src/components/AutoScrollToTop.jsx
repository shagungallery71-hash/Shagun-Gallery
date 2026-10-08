import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Automatically scrolls to the top of the page when the route changes.
 * Place this component inside BrowserRouter.
 */
export default function AutoScrollToTop() {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant' // Instant scroll is standard for page loads, 'smooth' can be jarring
        })
    }, [pathname])

    return null
}
