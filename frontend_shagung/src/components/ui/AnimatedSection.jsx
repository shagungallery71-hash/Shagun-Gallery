import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'

/**
 * AnimatedSection - Reveals content with animation when scrolled into view
 */
const AnimatedSection = ({
    children,
    className = '',
    animation = 'fadeUp',
    delay = 0,
    duration = 0.6,
    once = true,
    threshold = 0.2,
    ...props
}) => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once, amount: threshold })
    const controls = useAnimation()

    const animations = {
        fadeUp: {
            hidden: { opacity: 0, y: 40 },
            visible: { opacity: 1, y: 0 },
        },
        fadeDown: {
            hidden: { opacity: 0, y: -40 },
            visible: { opacity: 1, y: 0 },
        },
        fadeLeft: {
            hidden: { opacity: 0, x: -40 },
            visible: { opacity: 1, x: 0 },
        },
        fadeRight: {
            hidden: { opacity: 0, x: 40 },
            visible: { opacity: 1, x: 0 },
        },
        scaleUp: {
            hidden: { opacity: 0, scale: 0.9 },
            visible: { opacity: 1, scale: 1 },
        },
        blur: {
            hidden: { opacity: 0, filter: 'blur(10px)' },
            visible: { opacity: 1, filter: 'blur(0px)' },
        },
        none: {
            hidden: {},
            visible: {},
        },
    }

    useEffect(() => {
        if (isInView) {
            controls.start('visible')
        }
    }, [isInView, controls])

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={animations[animation]}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.1, 0.25, 1],
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

/**
 * StaggeredContainer - Staggers animation of child elements
 */
const StaggeredContainer = ({
    children,
    className = '',
    staggerDelay = 0.1,
    containerDelay = 0,
    ...props
}) => {
    const ref = useRef(null)
    // Use amount: 0 and margin to trigger animation as soon as the element is near the viewport
    // This ensures products are visible immediately on page load without needing to scroll
    const isInView = useInView(ref, { once: true, amount: 0, margin: '100px 0px 0px 0px' })

    const containerVariants = {
        hidden: { opacity: 1 }, // Start visible, not hidden
        visible: {
            opacity: 1,
            transition: {
                delayChildren: containerDelay,
                staggerChildren: staggerDelay,
            },
        },
    }

    return (
        <motion.div
            ref={ref}
            initial="visible" // Start as visible immediately
            animate={isInView ? 'visible' : 'visible'} // Always visible
            variants={containerVariants}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

/**
 * StaggeredItem - Child item for StaggeredContainer
 */
const StaggeredItem = ({
    children,
    className = '',
    animation = 'fadeUp',
    ...props
}) => {
    // Items now start visible to prevent scroll-to-show issue
    const itemVariants = {
        fadeUp: {
            hidden: { opacity: 1, y: 0 }, // Start visible
            visible: { opacity: 1, y: 0 },
        },
        fadeLeft: {
            hidden: { opacity: 1, x: 0 }, // Start visible
            visible: { opacity: 1, x: 0 },
        },
        fadeRight: {
            hidden: { opacity: 1, x: 0 }, // Start visible
            visible: { opacity: 1, x: 0 },
        },
        scale: {
            hidden: { opacity: 1, scale: 1 }, // Start visible
            visible: { opacity: 1, scale: 1 },
        },
    }

    return (
        <motion.div
            variants={itemVariants[animation]}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

/**
 * ParallaxSection - Creates parallax scrolling effect
 */
const ParallaxSection = ({
    children,
    className = '',
    speed = 0.5,
    ...props
}) => {
    const [offsetY, setOffsetY] = useState(0)
    const ref = useRef(null)

    useEffect(() => {
        const handleScroll = () => {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect()
                const scrollY = window.scrollY
                const elementTop = rect.top + scrollY
                const offset = (scrollY - elementTop) * speed
                setOffsetY(offset)
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [speed])

    return (
        <div ref={ref} className={`overflow-hidden ${className}`} {...props}>
            <motion.div style={{ y: offsetY }}>
                {children}
            </motion.div>
        </div>
    )
}

/**
 * CountUpNumber - Animates number counting up
 */
const CountUpNumber = ({
    value,
    duration = 2,
    prefix = '',
    suffix = '',
    className = '',
}) => {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (!isInView) return

        let startTime
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime
            const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)

            setCount(Math.floor(progress * value))

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }, [isInView, value, duration])

    return (
        <span ref={ref} className={className}>
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    )
}

/**
 * TextReveal - Reveals text word by word or character by character
 */
const TextReveal = ({
    text,
    className = '',
    by = 'word', // 'word' | 'character'
    delay = 0,
    stagger = 0.05,
}) => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    const items = by === 'word' ? text.split(' ') : text.split('')

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                delayChildren: delay,
                staggerChildren: stagger,
            },
        },
    }

    const child = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    }

    return (
        <motion.span
            ref={ref}
            variants={container}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className={className}
        >
            {items.map((item, i) => (
                <motion.span
                    key={i}
                    variants={child}
                    className="inline-block"
                    style={{ marginRight: by === 'word' ? '0.25em' : 0 }}
                >
                    {item}
                </motion.span>
            ))}
        </motion.span>
    )
}

export {
    AnimatedSection,
    StaggeredContainer,
    StaggeredItem,
    ParallaxSection,
    CountUpNumber,
    TextReveal,
}

export default AnimatedSection
