import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp, increment, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

export function useGameSession(sessionId) {
    const { user } = useAuth();
    const [session, setSession] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Listen to Session Updates
    useEffect(() => {
        if (!sessionId) return;

        const unsubscribe = onSnapshot(doc(db, "sessions", sessionId), async (docSnap) => {
            if (docSnap.exists()) {
                const sessionData = docSnap.data();
                setSession({ id: docSnap.id, ...sessionData });

                // Fetch Quiz Data if not already loaded
                if (!quiz && sessionData.quizId) {
                    // We need to fetch quiz data. 
                    // Note: In a real app, we might want to listen to this too, but usually static.
                    // For now, we'll just fetch it once inside the component using a separate effect or here.
                    // Let's do a quick fetch here for simplicity, but ideally we'd use a separate listener or fetch.
                    // Actually, let's just set a flag to fetch it.
                }
            } else {
                setError("Session not found");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [sessionId]);

    // 2. Fetch Quiz Data separately when session loads
    useEffect(() => {
        if (session?.quizId && !quiz) {
            const fetchQuiz = async () => {
                const quizDoc = await getDoc(doc(db, "quizzes", session.quizId));
                if (quizDoc.exists()) {
                    setQuiz({ id: quizDoc.id, ...quizDoc.data() });
                }
            };
            fetchQuiz();
        }
    }, [session?.quizId]);

    // 3. Join Session Logic
    useEffect(() => {
        if (session && user && !session.players[user.uid]) {
            // Auto-join if not in players list
            updateDoc(doc(db, "sessions", sessionId), {
                [`players.${user.uid}`]: {
                    name: user.displayName || "Anonymous",
                    score: 0,
                    status: "ready"
                }
            });
        }
    }, [session, user, sessionId]);

    // 4. Save History on Completion
    useEffect(() => {
        if (session?.status === "completed" && user && session.players[user.uid]) {
            const saveHistory = async () => {
                const playerStats = session.players[user.uid];
                // Check if we already saved this session to avoid duplicates (simple check)
                // In real app, use a subcollection or check ID.
                // For now, we'll just fire and forget, assuming this runs once per completion state change.
                // To be safe, we can check if the user has this quizId in recent history, but let's keep it simple.

                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                    history: arrayUnion({
                        sessionId: session.id,
                        quizId: session.quizId,
                        topic: quiz?.topic || "Unknown",
                        score: playerStats.score,
                        date: new Date().toISOString()
                    })
                });
            };
            saveHistory();
        }
    }, [session?.status, user]);

    // Actions
    const startGame = async () => {
        await updateDoc(doc(db, "sessions", sessionId), {
            status: "active",
            questionStartTime: serverTimestamp()
        });
    };

    const submitAnswer = async (questionIndex, answer, isCorrect) => {
        if (!user) return;

        let points = 0;
        if (isCorrect) {
            // Calculate time-based score (0-10)
            // Formula: Math.ceil(remainingSeconds / 3)
            // 28-30s -> 10 pts
            // 25-27s -> 9 pts
            // ...
            // 1-3s -> 1 pt
            const now = Date.now();
            const startTime = session.questionStartTime?.toMillis() || now;
            const elapsedSeconds = (now - startTime) / 1000;
            const remainingSeconds = Math.max(0, 30 - elapsedSeconds);

            points = Math.ceil(remainingSeconds / 3);
        }

        // Update player score
        const currentAnswers = session.players[user.uid].answers || {};

        await updateDoc(doc(db, "sessions", sessionId), {
            [`players.${user.uid}.score`]: increment(points),
            [`players.${user.uid}.lastAnswerIndex`]: questionIndex,
            [`players.${user.uid}.correctAnswers`]: increment(isCorrect ? 1 : 0),
            [`players.${user.uid}.answers`]: { ...currentAnswers, [questionIndex]: answer }
        });
    };

    const nextQuestion = async () => {
        const nextIndex = session.currentQuestionIndex + 1;
        if (nextIndex < quiz.questions.length) {
            await updateDoc(doc(db, "sessions", sessionId), {
                currentQuestionIndex: nextIndex,
                questionStartTime: serverTimestamp()
            });
        } else {
            await updateDoc(doc(db, "sessions", sessionId), {
                status: "completed"
            });
        }
    };

    return { session, quiz, loading, error, startGame, submitAnswer, nextQuestion, user };
}
