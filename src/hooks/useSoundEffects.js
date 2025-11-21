import { useState, useEffect, useRef } from 'react';

export function useSoundEffects() {
    const [isMuted, setIsMuted] = useState(false);

    // Refs for audio objects to avoid re-creating them
    const correctAudio = useRef(null);
    const wrongAudio = useRef(null);
    const tickAudio = useRef(null);
    const victoryAudio = useRef(null);
    const bgMusic = useRef(null);

    useEffect(() => {
        // Initialize audio objects
        // Using reliable CDN links for sound effects
        correctAudio.current = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_bb630cc098.mp3'); // Ding
        wrongAudio.current = new Audio('https://cdn.pixabay.com/audio/2022/11/20/audio_4d2cc8231f.mp3'); // Error buzz
        tickAudio.current = new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_c230d77d9e.mp3'); // Clock tick
        victoryAudio.current = new Audio('https://cdn.pixabay.com/audio/2021/08/09/audio_04d261602f.mp3'); // Success fanfare

        // Background music (lo-fi/ambient)
        bgMusic.current = new Audio('https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3');
        bgMusic.current.loop = true;
        bgMusic.current.volume = 0.3;

        return () => {
            // Cleanup
            if (bgMusic.current) {
                bgMusic.current.pause();
                bgMusic.current = null;
            }
        };
    }, []);

    const play = (audioRef) => {
        if (!isMuted && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
    };

    const playCorrect = () => play(correctAudio);
    const playWrong = () => play(wrongAudio);
    const playTick = () => play(tickAudio);
    const playVictory = () => play(victoryAudio);

    const toggleBackgroundMusic = (shouldPlay) => {
        if (!bgMusic.current) return;

        if (shouldPlay && !isMuted) {
            bgMusic.current.play().catch(e => console.log("BG Music failed:", e));
        } else {
            bgMusic.current.pause();
        }
    };

    const toggleMute = () => {
        setIsMuted(prev => {
            const newState = !prev;
            if (newState) {
                bgMusic.current?.pause();
            } else {
                bgMusic.current?.play().catch(e => console.log("BG Music failed:", e));
            }
            return newState;
        });
    };

    return {
        playCorrect,
        playWrong,
        playTick,
        playVictory,
        toggleBackgroundMusic,
        toggleMute,
        isMuted
    };
}
