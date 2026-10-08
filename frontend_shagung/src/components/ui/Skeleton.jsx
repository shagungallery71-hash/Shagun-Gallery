import { forwardRef } from 'react'

/**
 * Premium Skeleton Component
 * Use for loading states with smooth shimmer animation
 */

const Skeleton = forwardRef(({
    className = '',
    variant = 'default',
    ...props
}, ref) => {
    const variants = {
        default: 'rounded-md',
        text: 'h-4 rounded-md',
        title: 'h-7 w-3/4 rounded-md',
        avatar: 'h-12 w-12 rounded-full',
        image: 'aspect-square rounded-2xl',
        button: 'h-10 w-24 rounded-xl',
        card: 'rounded-2xl',
        circle: 'rounded-full',
    }

    return (
        <div
            ref={ref}
            className={`skeleton ${variants[variant]} ${className}`}
            {...props}
        />
    )
})

Skeleton.displayName = 'Skeleton'

// Pre-built skeleton patterns
const SkeletonProductCard = () => (
    <div className="rounded-2xl border border-border/50 overflow-hidden">
        <Skeleton className="aspect-[3/4] rounded-none" />
        <div className="p-4 space-y-3">
            <Skeleton variant="text" className="w-1/4" />
            <Skeleton variant="title" />
            <div className="flex gap-2">
                <Skeleton variant="text" className="w-16" />
                <Skeleton variant="text" className="w-12" />
            </div>
        </div>
    </div>
)

const SkeletonAvatar = ({ size = 'md' }) => {
    const sizes = {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
        xl: 'h-20 w-20',
    }
    return <Skeleton className={`rounded-full ${sizes[size]}`} />
}

const SkeletonLine = ({ width = 'full', className = '' }) => (
    <Skeleton
        variant="text"
        className={`${width === 'full' ? 'w-full' : `w-${width}`} ${className}`}
    />
)

const SkeletonParagraph = ({ lines = 3 }) => (
    <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                variant="text"
                className={i === lines - 1 ? 'w-2/3' : 'w-full'}
            />
        ))}
    </div>
)

const SkeletonCard = () => (
    <div className="rounded-2xl border border-border/50 p-6 space-y-4">
        <div className="flex items-center gap-4">
            <SkeletonAvatar />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-1/2" />
                <Skeleton variant="text" className="w-1/3" />
            </div>
        </div>
        <SkeletonParagraph lines={2} />
        <div className="flex gap-2">
            <Skeleton variant="button" />
            <Skeleton variant="button" className="w-20" />
        </div>
    </div>
)

const SkeletonStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-border/50 p-4 space-y-3">
                <Skeleton variant="text" className="w-1/2" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton variant="text" className="w-3/4" />
            </div>
        ))}
    </div>
)

const SkeletonTable = ({ rows = 5, cols = 4 }) => (
    <div className="rounded-2xl border border-border/50 overflow-hidden">
        <div className="bg-muted/50 p-4 border-b border-border/50">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} variant="text" className="w-3/4" />
                ))}
            </div>
        </div>
        <div className="divide-y divide-border/50">
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div
                    key={rowIdx}
                    className="p-4 grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                >
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <Skeleton
                            key={colIdx}
                            variant="text"
                            className={colIdx === 0 ? 'w-full' : 'w-2/3'}
                        />
                    ))}
                </div>
            ))}
        </div>
    </div>
)

export {
    Skeleton,
    SkeletonProductCard,
    SkeletonAvatar,
    SkeletonLine,
    SkeletonParagraph,
    SkeletonCard,
    SkeletonStats,
    SkeletonTable
}

export default Skeleton
