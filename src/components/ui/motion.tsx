"use client";

import { motion, HTMLMotionProps, Variants } from "framer-motion";
import React, { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

// ============================================
// Animation Variants
// ============================================

export const fadeInUp: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
};

export const fadeIn: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
};

export const scaleIn: Variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
};

export const slideInLeft: Variants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
};

export const slideInRight: Variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
};

export const staggerContainer: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};

export const staggerItem: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
        opacity: 1, 
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};

// ============================================
// Spring Configs
// ============================================

export const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30
};

export const gentleSpring = {
    type: "spring" as const,
    stiffness: 200,
    damping: 20
};

// ============================================
// Motion Components
// ============================================

interface MotionDivProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
}

// FadeIn Component
export const FadeIn = forwardRef<HTMLDivElement, MotionDivProps>(
    ({ children, className, ...props }, ref) => (
        <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
);
FadeIn.displayName = "FadeIn";

// FadeInUp Component
export const FadeInUp = forwardRef<HTMLDivElement, MotionDivProps & { delay?: number }>(
    ({ children, className, delay = 0, ...props }, ref) => (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ 
                duration: 0.4,
                delay,
                ease: [0.25, 0.4, 0.25, 1]
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
);
FadeInUp.displayName = "FadeInUp";

// ScaleIn Component
export const ScaleIn = forwardRef<HTMLDivElement, MotionDivProps & { delay?: number }>(
    ({ children, className, delay = 0, ...props }, ref) => (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
                duration: 0.3,
                delay,
                type: "spring",
                stiffness: 300,
                damping: 25
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
);
ScaleIn.displayName = "ScaleIn";

// SlideIn Component
export const SlideIn = forwardRef<HTMLDivElement, MotionDivProps & { direction?: "left" | "right" | "up" | "down"; delay?: number }>(
    ({ children, className, direction = "up", delay = 0, ...props }, ref) => {
        const directionMap = {
            left: { x: -30, y: 0 },
            right: { x: 30, y: 0 },
            up: { x: 0, y: 30 },
            down: { x: 0, y: -30 }
        };

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, ...directionMap[direction] }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, ...directionMap[direction] }}
                transition={{ 
                    duration: 0.4,
                    delay,
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                }}
                className={className}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
SlideIn.displayName = "SlideIn";

// Stagger Container
export const StaggerContainer = forwardRef<HTMLDivElement, MotionDivProps & { staggerDelay?: number }>(
    ({ children, className, staggerDelay = 0.08, ...props }, ref) => (
        <motion.div
            ref={ref}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={{
                initial: {},
                animate: {
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren: 0.1
                    }
                },
                exit: {
                    transition: {
                        staggerChildren: 0.05,
                        staggerDirection: -1
                    }
                }
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
);
StaggerContainer.displayName = "StaggerContainer";

// Stagger Item 
export const StaggerItem = forwardRef<HTMLDivElement, MotionDivProps>(
    ({ children, className, ...props }, ref) => (
        <motion.div
            ref={ref}
            variants={staggerItem}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
);
StaggerItem.displayName = "StaggerItem";

// ============================================
// Animated Card Component
// ============================================

interface AnimatedCardProps extends MotionDivProps {
    hoverScale?: number;
    hoverY?: number;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
    ({ children, className, hoverScale = 1.02, hoverY = -4, ...props }, ref) => (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ 
                scale: hoverScale, 
                y: hoverY,
                transition: { duration: 0.2, ease: "easeOut" }
            }}
            whileTap={{ scale: 0.98 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 24
            }}
            className={cn(
                "transition-shadow duration-300",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    )
);
AnimatedCard.displayName = "AnimatedCard";

// ============================================
// Animated Number Counter
// ============================================

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
}

export function AnimatedNumber({ 
    value, 
    duration = 1.2, 
    className,
    prefix = "",
    suffix = ""
}: AnimatedNumberProps) {
    return (
        <motion.span
            className={className}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {prefix}
            </motion.span>
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <CountingNumber value={value} duration={duration} />
            </motion.span>
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {suffix}
            </motion.span>
        </motion.span>
    );
}

// Internal component for counting animation
function CountingNumber({ value, duration }: { value: number; duration: number }) {
    const [displayValue, setDisplayValue] = React.useState(0);
    
    React.useEffect(() => {
        const startTime = Date.now();
        const startValue = 0;
        const endValue = value;
        
        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            
            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startValue + (endValue - startValue) * eased);
            
            setDisplayValue(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }, [value, duration]);

    return <>{displayValue.toLocaleString()}</>;
}

// ============================================
// Page Transition Wrapper
// ============================================

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
                duration: 0.3,
                ease: [0.25, 0.4, 0.25, 1]
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ============================================
// Hover Glow Effect
// ============================================

export function GlowCard({ 
    children, 
    className,
    glowColor = "rgba(220, 38, 38, 0.15)"
}: { 
    children: ReactNode; 
    className?: string;
    glowColor?: string;
}) {
    return (
        <motion.div
            className={cn("relative group", className)}
            whileHover="hover"
            initial="initial"
        >
            <motion.div
                className="absolute -inset-0.5 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: glowColor }}
                variants={{
                    initial: { opacity: 0 },
                    hover: { opacity: 1 }
                }}
            />
            <div className="relative">
                {children}
            </div>
        </motion.div>
    );
}

// ============================================
// Pulse Animation for Live Indicators
// ============================================

export function PulseIndicator({ 
    color = "bg-green-500",
    size = "w-2 h-2"
}: { 
    color?: string;
    size?: string;
}) {
    return (
        <span className="relative flex">
            <motion.span
                className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", color)}
                animate={{
                    scale: [1, 1.5, 1.5],
                    opacity: [0.75, 0, 0]
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "loop"
                }}
            />
            <span className={cn("relative inline-flex rounded-full", color, size)} />
        </span>
    );
}

// ============================================
// Shimmer Loading Effect
// ============================================

export function Shimmer({ className }: { className?: string }) {
    return (
        <div className={cn("relative overflow-hidden bg-gray-100 rounded-lg", className)}>
            <motion.div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
                animate={{ translateX: ["100%", "-100%"] }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
        </div>
    );
}
