import { motion, useScroll, useSpring } from 'framer-motion'

export function ScrollProgress() {
    const { scrollYProgress } = useScroll()

    // Spring physics for smooth "liquid" filling effect
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 origin-left z-[100] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
            style={{ scaleX }}
        />
    )
}
