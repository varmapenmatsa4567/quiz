import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ReactionOverlay({ emotes }) {
    const [visibleEmotes, setVisibleEmotes] = useState([]);
    const processedIds = useState(new Set())[0]; // Keep track of processed IDs without triggering re-renders

    useEffect(() => {
        if (emotes.length === 0) return;

        const newEmotes = emotes.filter(e => !processedIds.has(e.id));

        if (newEmotes.length > 0) {
            // Mark as processed
            newEmotes.forEach(e => processedIds.add(e.id));

            // Add to visible list
            setVisibleEmotes(prev => [...prev, ...newEmotes]);

            // Schedule removal for each new emote
            newEmotes.forEach(emote => {
                setTimeout(() => {
                    setVisibleEmotes(prev => prev.filter(e => e.id !== emote.id));
                }, 2500); // Slightly longer than animation to ensure exit
            });
        }
    }, [emotes, processedIds]);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            <AnimatePresence>
                {visibleEmotes.map((emote) => (
                    // Render a burst of 2 particles for each emote
                    [0, 1].map(i => (
                        <FloatingEmoji key={`${emote.id}-${i}`} emote={emote} />
                    ))
                ))}
            </AnimatePresence>
        </div>
    );
}

function FloatingEmoji({ emote }) {
    // Randomize starting position on the right side
    // Start slightly off-screen at the bottom
    const randomX = Math.random() * 15; // 0 to 15% variation
    const startRight = 5 + randomX + "%"; // 5% to 20% from right

    // Burst variation
    const burstDelay = Math.random() * 0.5; // 0 to 0.5s delay
    const burstX = (Math.random() * 100 - 50); // -50 to +50px spread

    return (
        <motion.div
            initial={{ opacity: 0, y: 100, x: 0, scale: 0.5 }}
            animate={{
                opacity: [0, 1, 1, 0], // Fade in, stay, fade out
                y: -window.innerHeight * 0.7, // Move UP higher
                scale: [0.5, 2, 2, 1.5], // Pulse effect
                x: burstX
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, delay: burstDelay, ease: "easeOut" }}
            className="absolute bottom-0 text-6xl md:text-8xl pointer-events-none" // Increased size
            style={{ right: startRight }}
        >
            {emote.emoji}
        </motion.div>
    );
}
