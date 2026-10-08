import { forwardRef } from 'react'

const variants = {
    default: 'badge-primary',
    secondary: 'badge-secondary',
    outline: 'badge-outline border-primary text-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    destructive: 'badge-destructive',
    new: 'badge-new',
    sale: 'badge-sale',
    ghost: 'bg-muted text-muted-foreground',
}

const sizes = {
    sm: 'text-[10px] px-2 py-0',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
}

const Badge = forwardRef(({
    children,
    variant = 'default',
    size = 'md',
    icon,
    dot = false,
    pulse = false,
    className = '',
    ...props
}, ref) => {
    return (
        <span
            ref={ref}
            className={`
        badge ${variants[variant]} ${sizes[size]}
        ${className}
      `}
            {...props}
        >
            {dot && (
                <span className={`
          w-1.5 h-1.5 rounded-full bg-current mr-1.5
          ${pulse ? 'animate-pulse' : ''}
        `} />
            )}
            {icon && <span className="mr-1">{icon}</span>}
            {children}
        </span>
    )
})

Badge.displayName = 'Badge'

// Pre-styled status badges
const StatusBadge = ({ status }) => {
    const statusConfig = {
        active: { variant: 'success', label: 'Active', dot: true },
        inactive: { variant: 'secondary', label: 'Inactive', dot: true },
        pending: { variant: 'warning', label: 'Pending', dot: true, pulse: true },
        error: { variant: 'destructive', label: 'Error', dot: true },
        new: { variant: 'new', label: 'New' },
        sale: { variant: 'sale', label: 'Sale' },
        'best-seller': { variant: 'default', label: 'Best Seller' },
        'limited': { variant: 'warning', label: 'Limited' },
        'sold-out': { variant: 'ghost', label: 'Sold Out' },
    }

    const config = statusConfig[status] || statusConfig.active

    return (
        <Badge
            variant={config.variant}
            dot={config.dot}
            pulse={config.pulse}
        >
            {config.label}
        </Badge>
    )
}

export { Badge, StatusBadge }
export default Badge
