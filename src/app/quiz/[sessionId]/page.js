"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useGameSession } from "@/hooks/useGameSession";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { clsx } from "clsx";
import confetti from "canvas-confetti";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export default function QuizPage() {
    const { sessionId } = useParams();
    const { session, quiz, loading, error, startGame, submitAnswer, nextQuestion, user } = useGameSession(sessionId);
    const { login } = useAuth();
    const router = useRouter();
    const { playCorrect, playWrong, playTick, playVictory, toggleBackgroundMusic, toggleMute, isMuted } = useSoundEffects();

    // Manage Background Music based on session status
    useEffect(() => {
        if (session?.status === "waiting") {
            toggleBackgroundMusic(true);
        } else {
            toggleBackgroundMusic(false);
        }
        return () => toggleBackgroundMusic(false);
    }, [session?.status]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading Session...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-4">
                <Card glass className="p-8 text-center max-w-md">
                    <h1 className="text-3xl font-bold mb-4">Login Required</h1>
                    <p className="text-gray-400 mb-8">You must be logged in to join this quiz session.</p>
                    <Button onClick={login} variant="primary" size="lg" className="w-full">
                        Login with Google
                    </Button>
                </Card>
            </div>
        );
    }

    if (!session || !quiz) return <div className="min-h-screen flex items-center justify-center text-white">Initializing...</div>;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans overflow-hidden relative">
            {/* Mute Button */}
            <button
                onClick={toggleMute}
                className="absolute top-4 right-4 z-50 p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 transition-all"
                title={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? "🔇" : "🔊"}
            </button>

            <AnimatePresence mode="wait">
                {session.status === "waiting" && (
                    <LobbyView key="lobby" session={session} quiz={quiz} startGame={startGame} user={user} />
                )}
                {session.status === "active" && (
                    <GameView
                        key="game"
                        session={session}
                        quiz={quiz}
                        submitAnswer={submitAnswer}
                        nextQuestion={nextQuestion}
                        user={user}
                        sounds={{ playCorrect, playWrong, playTick }}
                    />
                )}
                {session.status === "completed" && (
                    <ResultsView
                        key="results"
                        session={session}
                        quiz={quiz}
                        user={user}
                        playVictory={playVictory}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function LobbyView({ session, quiz, startGame, user }) {
    const isHost = session.hostId === user?.uid;
    const players = Object.values(session.players);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto p-4 md:p-8 pt-20 min-h-screen flex flex-col"
        >
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    {quiz.topic}
                </h1>
                <p className="text-xl text-gray-400">Waiting for players to join...</p>
            </div>

            <Card glass className="p-8 mb-8 flex-1 border-primary/20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/25">
                        {players.length}
                    </span>
                    Players Joined
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {players.map((player, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/5 p-4 rounded-xl flex items-center gap-3 border border-white/5"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-lg shadow-lg">
                                {player.name[0].toUpperCase()}
                            </div>
                            <span className="font-medium truncate">{player.name}</span>
                        </motion.div>
                    ))}
                </div>
            </Card>

            {isHost ? (
                <Button
                    onClick={startGame}
                    variant="primary"
                    size="lg"
                    className="w-full py-6 text-xl shadow-xl shadow-primary/20"
                >
                    Start Quiz
                </Button>
            ) : (
                <div className="text-center text-gray-400 animate-pulse p-4 bg-white/5 rounded-xl">
                    Waiting for host to start...
                </div>
            )}
        </motion.div>
    );
}

function GameView({ session, quiz, submitAnswer, nextQuestion, user, sounds }) {
    const question = quiz.questions[session.currentQuestionIndex];
    const [timeLeft, setTimeLeft] = useState(30);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [shake, setShake] = useState(false);
    const isHost = session.hostId === user?.uid;
    const { playCorrect, playWrong, playTick } = sounds;

    const leader = Object.values(session.players).sort((a, b) => b.score - a.score)[0];

    // Timer Logic
    useEffect(() => {
        if (!session.questionStartTime) {
            setTimeLeft(30);
            return;
        }

        const startTime = session.questionStartTime.toMillis();

        const updateTimer = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            const remaining = Math.max(30 - elapsed, 0);
            setTimeLeft(remaining);

            if (remaining <= 5 && remaining > 0) {
                playTick();
            }

            return remaining;
        };

        updateTimer(); // Initial update

        const timer = setInterval(() => {
            const remaining = updateTimer();
            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [session.questionStartTime, session.currentQuestionIndex]);

    // Reset state when question changes
    useEffect(() => {
        setSelectedOption(null);
        setIsAnswered(false);
    }, [session.currentQuestionIndex]);

    // Auto-advance: All Answered (Host Only)
    useEffect(() => {
        if (!session || !quiz || session.hostId !== user?.uid || session.status !== "active") return;

        const currentQIndex = session.currentQuestionIndex;
        const playersList = Object.values(session.players);
        const allAnswered = playersList.every(p => p.lastAnswerIndex === currentQIndex);

        if (allAnswered) {
            const timer = setTimeout(() => {
                nextQuestion();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [session, quiz, user]);

    // Auto-advance: Time Up (Host Only)
    useEffect(() => {
        if (!session || session.hostId !== user?.uid || session.status !== "active") return;

        if (timeLeft === 0) {
            nextQuestion();
        }
    }, [timeLeft, session?.hostId, session?.status, user?.uid]);


    const handleAnswer = (option, index) => {
        if (isAnswered || timeLeft === 0) return;
        setSelectedOption(index);
        setIsAnswered(true);
        const isCorrect = option === question.answer;

        if (isCorrect) {
            playCorrect();
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } else {
            playWrong();
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }

        submitAnswer(session.currentQuestionIndex, option, isCorrect);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto p-4 md:p-8 pt-12 min-h-screen flex flex-col"
        >
            <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col">
                    <span className="text-gray-400 font-medium bg-white/5 px-4 py-2 rounded-full mb-2 self-start">
                        Question {session.currentQuestionIndex + 1} / {quiz.questions.length}
                    </span>
                    {leader && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-sm font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full self-start border border-yellow-500/20"
                        >
                            <span>👑</span>
                            <span>Leading: {leader.name}</span>
                        </motion.div>
                    )}
                </div>
                <div className={clsx(
                    "text-2xl font-bold font-mono px-4 py-2 rounded-full border",
                    timeLeft < 10 ? "text-red-500 border-red-500/50 bg-red-500/10" : "text-primary border-primary/50 bg-primary/10"
                )}>
                    {timeLeft}s
                </div>
            </div>

            <Card
                glass
                className={clsx(
                    "p-6 md:p-10 mb-8 border-primary/20 shadow-2xl shadow-primary/5 transition-transform",
                    shake && "animate-shake" // We'll use framer motion instead for smoother control
                )}
            >
                <motion.div
                    animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                >
                    <div className="text-2xl md:text-3xl font-bold mb-8 leading-relaxed">
                        <QuestionRenderer text={question.text} />
                    </div>

                    <div className="space-y-4">
                        {question.options.map((option, idx) => {
                            const isSelected = selectedOption === idx;
                            const isCorrect = option === question.answer;
                            const showResult = isAnswered;

                            let btnClass = "w-full text-left p-6 rounded-xl border-2 transition-all font-medium text-lg relative overflow-hidden ";

                            if (showResult) {
                                if (isSelected) {
                                    btnClass += isCorrect
                                        ? "bg-green-500/20 border-green-500 text-green-400"
                                        : "bg-red-500/20 border-red-500 text-red-400";
                                } else if (isCorrect) {
                                    btnClass += "bg-green-500/20 border-green-500 text-green-400";
                                } else {
                                    btnClass += "bg-white/5 border-white/5 opacity-50";
                                }
                            } else {
                                btnClass += "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.99]";
                            }

                            return (
                                <button
                                    key={idx}
                                    disabled={isAnswered || timeLeft === 0}
                                    onClick={() => handleAnswer(option, idx)}
                                    className={btnClass}
                                >
                                    <span className="mr-4 opacity-50 font-mono">{String.fromCharCode(65 + idx)}.</span>
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </Card>
        </motion.div>
    );
}

function ResultsView({ session, quiz, user, playVictory }) {
    const players = Object.values(session.players).sort((a, b) => b.score - a.score);

    useEffect(() => {
        playVictory();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto p-4 md:p-8 pt-20 text-center min-h-screen flex flex-col justify-center"
        >
            <h1 className="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Quiz Completed!
            </h1>
            <p className="text-gray-400 mb-12 text-xl">Final Standings</p>

            <Card glass className="overflow-hidden border-primary/20 shadow-2xl shadow-primary/10 mb-12">
                {players.map((player, idx) => (
                    <div
                        key={idx}
                        className={clsx(
                            "flex items-center justify-between p-6 border-b border-white/5 last:border-0",
                            player.name === user?.displayName && "bg-primary/10"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className={clsx(
                                "w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg",
                                idx === 0 ? "bg-yellow-500 text-black" :
                                    idx === 1 ? "bg-gray-300 text-black" :
                                        idx === 2 ? "bg-orange-700 text-white" : "bg-gray-800 text-gray-400"
                            )}>
                                {idx + 1}
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg">{player.name}</div>
                                {idx === 0 && <div className="text-xs text-yellow-500 font-bold">🏆 Winner</div>}
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-primary text-right">
                            <div>{player.score} <span className="text-sm text-gray-500 font-normal">pts</span></div>
                            <div className="text-xs text-gray-400 font-normal mt-1">
                                {player.correctAnswers || 0}/{quiz.questions.length} correct
                            </div>
                        </div>
                    </div>
                ))}
            </Card>

            <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Review Answers</h2>
                <div className="space-y-4 text-left">
                    {quiz.questions.map((q, idx) => {
                        const playerStats = session.players[user?.uid];
                        const userAnswer = playerStats?.answers?.[idx];

                        return (
                            <ReviewItem key={idx} question={q} index={idx} userAnswer={userAnswer} />
                        );
                    })}
                </div>
            </div>

            <Link href="/" className="inline-block">
                <Button variant="secondary" size="lg" className="shadow-xl shadow-secondary/20">
                    Back to Home
                </Button>
            </Link>
        </motion.div>
    );
}

function QuestionRenderer({ text }) {
    const parts = text.split('```');
    return parts.map((part, index) => {
        if (index % 2 === 1) {
            // Code block
            return (
                <pre key={index} className="bg-black/50 p-4 rounded-lg my-4 overflow-x-auto whitespace-pre break-words md:text-sm text-xs font-mono border border-white/10 shadow-inner">
                    <code>{part.trim()}</code>
                </pre>
            );
        }
        // Normal text (handle inline code)
        return part.split('`').map((subPart, subIndex) => {
            if (subIndex % 2 === 1) {
                return (
                    <code key={`${index}-${subIndex}`} className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-sm text-primary/80 border border-white/5">
                        {subPart}
                    </code>
                );
            }
            return <span key={`${index}-${subIndex}`}>{subPart}</span>;
        });
    });
}

function ReviewItem({ question, index, userAnswer }) {
    const [explanation, setExplanation] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleExplain = async () => {
        if (explanation) return;
        setLoading(true);
        try {
            const res = await fetch("/api/explain-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: question.text,
                    correctAnswer: question.answer,
                    userAnswer: userAnswer
                })
            });
            const data = await res.json();
            setExplanation(data.explanation);
        } catch (error) {
            console.error("Failed to get explanation", error);
        } finally {
            setLoading(false);
        }
    };

    const isCorrect = userAnswer === question.answer;

    return (
        <Card glass className="p-6 border-white/5">
            <div className="flex justify-between items-start gap-4 mb-4">
                <div className="w-full">
                    <span className="text-xs font-mono text-gray-500 mb-1 block">Question {index + 1}</span>
                    <div className="font-medium text-lg mb-4">
                        <QuestionRenderer text={question.text} />
                    </div>
                </div>
                <Button
                    onClick={handleExplain}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="shrink-0"
                >
                    {loading ? "Thinking..." : "✨ Explain with AI"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className={clsx(
                    "p-3 rounded-lg border",
                    isCorrect ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                )}>
                    <span className={clsx(
                        "text-xs font-bold uppercase tracking-wider",
                        isCorrect ? "text-green-500" : "text-red-500"
                    )}>Your Answer</span>
                    <p className={clsx(
                        "font-medium",
                        isCorrect ? "text-green-400" : "text-red-400"
                    )}>{userAnswer || "No Answer"}</p>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                    <span className="text-xs text-green-500 font-bold uppercase tracking-wider">Correct Answer</span>
                    <p className="text-green-400 font-medium">{question.answer}</p>
                </div>
            </div>

            {explanation && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-primary/10 border border-primary/20 p-4 rounded-lg"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🤖</span>
                        <span className="font-bold text-primary text-sm">Gemini Explanation</span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-300">{explanation}</p>
                </motion.div>
            )}
        </Card>
    );
}


