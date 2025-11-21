"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const history = data.history || [];

                    // Calculate stats
                    const totalGames = history.length;
                    const totalScore = history.reduce((acc, curr) => acc + (curr.score || 0), 0);
                    const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;

                    // Sort history by date desc
                    const sortedHistory = [...history].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );

                    setStats({
                        totalGames,
                        totalScore,
                        avgScore,
                        history: sortedHistory
                    });
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading Profile...</div>;

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please Login</h1>
                    <Link href="/">
                        <Button variant="primary">Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm">← Back</Button>
                        </Link>
                        <h1 className="text-3xl font-bold">My Profile</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {user.photoURL && (
                            <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full border-2 border-primary" />
                        )}
                        <span className="font-medium text-lg">{user.displayName}</span>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatsCard label="Total Games" value={stats?.totalGames || 0} icon="🎮" delay={0} />
                    <StatsCard label="Total Points" value={stats?.totalScore || 0} icon="⭐" delay={0.1} />
                    <StatsCard label="Avg Score" value={stats?.avgScore || 0} icon="📈" delay={0.2} />
                </div>

                {/* History Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span>📜</span> Recent Activity
                    </h2>

                    {stats?.history?.length > 0 ? (
                        <div className="space-y-4">
                            {stats.history.map((game, idx) => (
                                <Card key={idx} glass className="p-6 flex items-center justify-between border-white/5 hover:bg-white/5 transition-colors">
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{game.topic}</h3>
                                        <p className="text-sm text-gray-400">
                                            {new Date(game.date).toLocaleDateString()} • {new Date(game.date).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">{game.score}</div>
                                        <div className="text-xs text-gray-500">points</div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-gray-400 mb-4">No games played yet.</p>
                            <Link href="/">
                                <Button variant="primary">Play a Quiz</Button>
                            </Link>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

function StatsCard({ label, value, icon, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
        >
            <Card glass className="p-6 border-primary/20 bg-gradient-to-br from-white/5 to-transparent">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-gray-400 font-medium">{label}</span>
                    <span className="text-2xl">{icon}</span>
                </div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    {value}
                </div>
            </Card>
        </motion.div>
    );
}
