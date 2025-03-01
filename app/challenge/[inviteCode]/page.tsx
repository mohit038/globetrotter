"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ChallengerInfo {
  id: string;
  username: string;
  score: number;
}

export default function ChallengePage({
  params,
}: {
  params: { inviteCode: string };
}) {
  const [challenger, setChallenger] = useState<ChallengerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { inviteCode } = params;

  useEffect(() => {
    // Fetch challenge info
    const fetchChallengeInfo = async () => {
      try {
        const response = await fetch(`/api/challenge/${inviteCode}`);

        if (!response.ok) {
          throw new Error("Challenge not found");
        }

        const data = await response.json();
        setChallenger(data.challenger);
      } catch (err) {
        setError("This challenge link is invalid or has expired.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallengeInfo();
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create user
      const createResponse = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        setError(createData.error || "Failed to create user");
        setIsSubmitting(false);
        return;
      }

      // Save username to localStorage
      localStorage.setItem("globetrotter_username", username);
      localStorage.setItem("globetrotter_userId", createData.id);

      // Redirect to game page
      router.push("/game");
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600">
        <div className="text-white text-xl">Loading challenge...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Challenge Error
          </h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center">
            <span className="mr-2">🌍</span> GLOBETROTTER
          </h1>
          <p className="text-blue-100 mt-2">Challenge Accepted!</p>
        </div>

        <div className="p-6">
          {challenger && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-gray-700 mb-2">
                <span className="font-bold">{challenger.username}</span> has
                challenged you!
              </p>
              <p className="text-gray-600 text-sm">
                Their current score:{" "}
                <span className="font-bold">{challenger.score}</span> points
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Can you beat their score?
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Enter Your Username to Play
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your unique username"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Loading..." : "Accept Challenge"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
