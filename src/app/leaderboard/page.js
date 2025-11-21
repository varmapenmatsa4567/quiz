"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { useAuth } from "@/context/AuthContext";

export default function LeaderboardPage() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const q = query(collection(db, "users"), orderBy("totalScore", "desc"), limit(50));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLeaders(data);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaders();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading Leaderboard...</div>;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm">← Back</Button>
                        </Link>
                        <h1 className="text-3xl font-bold">Global Leaderboard</h1>
                    </div>
                </header>

                <Card glass className="overflow-hidden border-primary/20 shadow-2xl shadow-primary/10">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 font-bold text-gray-400 text-sm uppercase tracking-wider">
                        <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                        <div className="col-span-6 md:col-span-7">Player</div>
                        <div className="col-span-2 text-right">Games</div>
                        <div className="col-span-2 text-right">Score</div>
                    </div>

                    {leaders.length > 0 ? (
                        leaders.map((leader, idx) => (
                            <motion.div
                                key={leader.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={clsx(
                                    "grid grid-cols-12 gap-4 p-4 border-b border-white/5 last:border-0 items-center hover:bg-white/5 transition-colors",
                                    leader.id === user?.uid && "bg-primary/10 border-l-4 border-l-primary"
                                )}
                            >
                                <div className="col-span-2 md:col-span-1 flex justify-center">
                                    <div className={clsx(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                        idx === 0 ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/50" :
                                            idx === 1 ? "bg-gray-300 text-black shadow-lg shadow-gray-300/50" :
                                                idx === 2 ? "bg-orange-700 text-white shadow-lg shadow-orange-700/50" : "text-gray-500"
                                    )}>
                                        {idx + 1}
                                    </div>
                                </div>
                                <div className="col-span-6 md:col-span-7 flex items-center gap-3">
                                    {leader.photoURL ? (
                                        <img src={leader.photoURL} alt={leader.displayName} className="w-8 h-8 rounded-full" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-xs">
                                            {leader.displayName?.[0]?.toUpperCase() || "?"}
                                        </div>
                                    )}
                                    <span className={clsx("font-medium truncate", leader.id === user?.uid && "text-primary font-bold")}>
                                        {leader.displayName || "Anonymous"}
                                    </span>
                                </div>
                                <div className="col-span-2 text-right text-gray-400 font-mono">
                                    {leader.totalGames || 0}
                                </div>
                                <div className="col-span-2 text-right font-bold text-primary font-mono">
                                    {leader.totalScore || 0}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No players ranked yet. Be the first!
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
