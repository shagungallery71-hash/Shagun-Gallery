import Cookies from 'js-cookie'

export const cookieStorage = {
    getItem: (key) => Cookies.get(key),
    setItem: (key, value) => {
        // Set cookie with expiry (e.g., 7 days) and path '/'
        // Secure: true should be used in production with HTTPS
        Cookies.set(key, value, { expires: 7, path: '/' })
    },
    removeItem: (key) => Cookies.remove(key, { path: '/' })
}
