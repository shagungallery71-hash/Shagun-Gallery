import { forwardRef } from 'react'

const Input = forwardRef(({
    className = '',
    type = 'text',
    error = false,
    icon,
    rightIcon,
    ...props
}, ref) => {
    return (
        <div className="relative">
            {icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {icon}
                </div>
            )}
            <input
                ref={ref}
                type={type}
                className={`
          w-full h-11 px-4 rounded-xl
          bg-background border border-border
          text-foreground placeholder:text-muted-foreground
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          hover:border-primary/50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${icon ? 'pl-10' : ''}
          ${rightIcon ? 'pr-10' : ''}
          ${error ? 'border-destructive focus:ring-destructive/20 focus:border-destructive' : ''}
          ${className}
        `}
                {...props}
            />
            {rightIcon && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {rightIcon}
                </div>
            )}
        </div>
    )
})

Input.displayName = 'Input'

const SearchInput = forwardRef(({ className = '', ...props }, ref) => {
    return (
        <div className="relative group">
            <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                ref={ref}
                type="search"
                placeholder="Search..."
                className={`
          w-full h-11 pl-10 pr-4 rounded-full
          bg-muted/50 border border-transparent
          text-foreground placeholder:text-muted-foreground
          transition-all duration-300
          focus:outline-none focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10
          hover:bg-muted
          ${className}
        `}
                {...props}
            />
        </div>
    )
})

SearchInput.displayName = 'SearchInput'

export { Input, SearchInput }
export default Input
