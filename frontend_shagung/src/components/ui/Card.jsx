import { forwardRef } from 'react'

const Card = forwardRef(({
    children,
    className = '',
    hover = false,
    glow = false,
    glass = false,
    gradient = false,
    ...props
}, ref) => {
    const baseClasses = `
    rounded-2xl border border-border/50 bg-card
    transition-all duration-300
  `

    const hoverClasses = hover ? 'card-hover' : ''
    const glowClasses = glow ? 'card-hover-glow' : ''
    const glassClasses = glass ? 'glass-card' : ''
    const gradientClasses = gradient ? 'bg-gradient-card' : ''

    return (
        <div
            ref={ref}
            className={`${baseClasses} ${hoverClasses} ${glowClasses} ${glassClasses} ${gradientClasses} ${className}`}
            {...props}
        >
            {children}
        </div>
    )
})

Card.displayName = 'Card'

const CardHeader = forwardRef(({ children, className = '', ...props }, ref) => (
    <div
        ref={ref}
        className={`p-6 pb-0 ${className}`}
        {...props}
    >
        {children}
    </div>
))

CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef(({ children, className = '', ...props }, ref) => (
    <h3
        ref={ref}
        className={`font-heading text-xl font-semibold tracking-tight ${className}`}
        {...props}
    >
        {children}
    </h3>
))

CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef(({ children, className = '', ...props }, ref) => (
    <p
        ref={ref}
        className={`text-sm text-muted-foreground mt-1 ${className}`}
        {...props}
    >
        {children}
    </p>
))

CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef(({ children, className = '', ...props }, ref) => (
    <div
        ref={ref}
        className={`p-6 ${className}`}
        {...props}
    >
        {children}
    </div>
))

CardContent.displayName = 'CardContent'

const CardFooter = forwardRef(({ children, className = '', ...props }, ref) => (
    <div
        ref={ref}
        className={`p-6 pt-0 flex items-center ${className}`}
        {...props}
    >
        {children}
    </div>
))

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
export default Card
