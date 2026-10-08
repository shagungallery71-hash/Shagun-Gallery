import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 btn-glow btn-shine',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground',
    ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    gradient: 'bg-gradient-to-r from-primary via-pink-500 to-rose-500 text-white hover:opacity-90 btn-shine',
    glass: 'glass-card text-foreground hover:bg-white/20',
}

const sizes = {
    sm: 'h-9 px-4 text-sm rounded-lg',
    md: 'h-11 px-6 text-sm rounded-xl',
    lg: 'h-12 px-8 text-base rounded-xl',
    xl: 'h-14 px-10 text-lg rounded-2xl',
    icon: 'h-10 w-10 rounded-xl',
}

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loading = false, // Alias for isLoading
    disabled = false,
    className = '',
    leftIcon,
    rightIcon,
    ...props
}, ref) => {
    // Combine isLoading and loading props
    const showLoading = isLoading || loading;

    const baseClasses = `
    relative inline-flex items-center justify-center gap-2
    font-semibold transition-all duration-300
    focus-ring disabled:opacity-50 disabled:pointer-events-none
    active:scale-[0.98]
  `

    return (
        <button
            ref={ref}
            disabled={disabled || showLoading}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {showLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {leftIcon && <span className="shrink-0">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="shrink-0">{rightIcon}</span>}
                </>
            )}
        </button>
    )
})

Button.displayName = 'Button'

export default Button
