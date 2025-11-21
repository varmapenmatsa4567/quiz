import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

export function useGameEmotes(sessionId, user) {
    const [emotes, setEmotes] = useState([]);

    useEffect(() => {
        if (!sessionId) return;

        // Listen to the last 10 emotes
        const q = query(
            collection(db, "sessions", sessionId, "emotes"),
            orderBy("timestamp", "desc"),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newEmotes = snapshot.docChanges()
                .filter(change => change.type === "added")
                .map(change => ({
                    id: change.doc.id,
                    ...change.doc.data(),
                    // Add a local timestamp if serverTimestamp is null (pending write)
                    timestamp: change.doc.data().timestamp || { toMillis: () => Date.now() }
                }));

            if (newEmotes.length > 0) {
                setEmotes(prev => [...prev, ...newEmotes]);
            }
        });

        return () => unsubscribe();
    }, [sessionId]);

    const sendEmote = async (emoji) => {
        if (!sessionId || !user) return;

        try {
            await addDoc(collection(db, "sessions", sessionId, "emotes"), {
                emoji,
                senderId: user.uid,
                senderName: user.displayName || "Anonymous",
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending emote:", error);
        }
    };

    return { emotes, sendEmote };
}
