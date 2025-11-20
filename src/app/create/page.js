"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function CreateQuiz() {
    const { user } = useAuth();
    const router = useRouter();
    const [topic, setTopic] = useState("");
    const [count, setCount] = useState(5);
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!user) return alert("Please login to create a quiz");
        setLoading(true);

        try {
            // 1. Generate Questions via API
            const res = await fetch("/api/generate-quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, count }),
            });

            if (!res.ok) throw new Error("Failed to generate questions");

            const { questions } = await res.json();

            // 2. Save to Firestore
            const docRef = await addDoc(collection(db, "quizzes"), {
                topic,
                questions,
                createdBy: user.uid,
                creatorName: user.displayName || "Anonymous",
                createdAt: serverTimestamp(),
                questionCount: parseInt(count),
            });

            router.push("/"); // Redirect to home (or lobby later)
        } catch (error) {
            console.error(error);
            alert("Error creating quiz. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                <div className="mb-8 text-center">
                    <Link href="/" className="text-sm text-gray-400 hover:text-primary transition mb-4 inline-block">
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        Create New Quiz
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Enter a topic and let AI generate the questions for you.
                    </p>
                </div>

                <Card glass className="p-8 border-primary/20 shadow-2xl shadow-primary/10">
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Topic</label>
                            <Input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Solar System, 90s Music, ReactJS"
                                required
                                className="bg-background/50 border-primary/20 focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Number of Questions</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[5, 10, 15].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setCount(num)}
                                        className={`py-2 rounded-lg font-medium transition-all ${count == num
                                                ? "bg-primary text-white shadow-lg shadow-primary/25"
                                                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                            }`}
                                    >
                                        {num} Qs
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={loading}
                            variant="primary"
                            className="w-full py-4 text-lg"
                        >
                            {loading ? "Generating Magic..." : "Create Quiz"}
                        </Button>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
