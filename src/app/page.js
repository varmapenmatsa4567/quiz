"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  const { user, login, logout, loading } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuizzes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const [sessions, setSessions] = useState([]);
  useEffect(() => {
    // Query waiting sessions
    const q = query(collection(db, "sessions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeSessions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(s => s.status === "waiting"); // Only show waiting lobbies
      setSessions(activeSessions);
    });
    return () => unsubscribe();
  }, []);

  const startSession = async (quizId) => {
    if (!user) return login();

    try {
      const sessionRef = await addDoc(collection(db, "sessions"), {
        quizId,
        hostId: user.uid,
        status: "waiting",
        createdAt: serverTimestamp(),
        players: {
          [user.uid]: {
            name: user.displayName,
            score: 0,
            status: "ready"
          }
        },
        currentQuestionIndex: 0
      });
      router.push(`/quiz/${sessionRef.id}`);
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  const handleDeleteQuiz = async (quizId, e) => {
    e.stopPropagation(); // Prevent triggering other clicks if any
    if (!confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "quizzes", quizId));
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert("Failed to delete quiz.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-16 max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
            Q
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Quiz<span className="text-primary">Master</span>
          </h1>
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm hidden md:inline">Welcome, {user.displayName}</span>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm">
                  🏆 Leaders
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
              <Link href="/create">
                <Button variant="primary" className="hidden md:inline-flex">
                  + Create Quiz
                </Button>
              </Link>
            </div>
          ) : (
            <Button onClick={login} variant="primary">
              Login with Google
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto flex flex-col gap-16">
        {/* Hero Section */}
        <section className="text-center space-y-6 py-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent"
          >
            Challenge Your Friends
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Create AI-powered quizzes in seconds and play in real-time with anyone, anywhere.
          </motion.p>

          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="md:hidden"
            >
              <Link href="/create">
                <Button variant="primary" size="lg" className="w-full">
                  Create New Quiz
                </Button>
              </Link>
            </motion.div>
          )}
        </section>

        {/* Active Sessions Section */}
        {sessions.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-2xl font-bold">Live Sessions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => {
                const quiz = quizzes.find(q => q.id === session.quizId);
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card glass hoverEffect className="border-primary/20 bg-primary/5 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-full">
                            LIVE
                          </span>
                          <span className="text-xs text-gray-400">
                            {Object.keys(session.players).length} Players
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{quiz?.topic || "Unknown Quiz"}</h3>
                        <p className="text-sm text-gray-400 mb-4">
                          Host: {Object.values(session.players).find(p => p.name)?.name || "Unknown"}
                        </p>
                      </div>
                      <Link href={`/quiz/${session.id}`} className="w-full">
                        <Button variant="secondary" className="w-full">
                          Join Lobby
                        </Button>
                      </Link>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* All Quizzes Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Explore Quizzes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ y: -5 }}
              >
                <Card hoverEffect className="h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-gray-800 text-gray-300 text-xs font-bold px-2 py-1 rounded-full">
                        {quiz.questionCount} Qs
                      </span>
                      {user?.uid === quiz.createdBy && (
                        <button
                          onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                          className="text-gray-500 hover:text-red-500 transition p-1"
                          title="Delete Quiz"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <h3 className="text-lg font-bold mb-2 line-clamp-2">{quiz.topic}</h3>
                    <p className="text-xs text-gray-500 mb-4">
                      By {quiz.creatorName}
                    </p>
                  </div>

                  {user?.uid === quiz.createdBy ? (
                    <Button
                      onClick={() => startSession(quiz.id)}
                      variant="outline"
                      className="w-full hover:bg-primary hover:border-primary hover:text-white"
                    >
                      Start Live Session
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="ghost"
                      className="w-full opacity-50 cursor-not-allowed text-xs"
                    >
                      Creator Only
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {quizzes.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🌪️</div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">No quizzes yet</h3>
              <p className="text-gray-500">Be the first to create a quiz!</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
