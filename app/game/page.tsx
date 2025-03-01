"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";

interface Destination {
  id: string;
  name: string;
}

interface Clue {
  id: string;
  text: string;
}

interface Fact {
  id: string;
  text: string;
  isTrivia: boolean;
}

export default function GamePage() {
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [incorrectGuesses, setIncorrectGuesses] = useState(0);

  const [currentDestination, setCurrentDestination] =
    useState<Destination | null>(null);
  const [clues, setClues] = useState<Clue[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [options, setOptions] = useState<Destination[]>([]);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [revealedFact, setRevealedFact] = useState<Fact | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const storedUsername = localStorage.getItem("globetrotter_username");
    const storedUserId = localStorage.getItem("globetrotter_userId");

    if (!storedUsername || !storedUserId) {
      router.push("/");
      return;
    }

    setUsername(storedUsername);
    setUserId(storedUserId);

    // Load user stats
    fetchUserStats(storedUserId);

    // Load a new game
    loadNewGame();
  }, [router]);

  const fetchUserStats = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setScore(data.score);
        setCorrectGuesses(data.correctGuesses);
        setIncorrectGuesses(data.incorrectGuesses);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const loadNewGame = async () => {
    setIsLoading(true);
    setSelectedOption(null);
    setIsCorrect(null);
    setRevealedFact(null);

    try {
      const response = await fetch("/api/game/new");
      if (response.ok) {
        const data = await response.json();
        setCurrentDestination(data.destination);
        setClues(data.clues);
        setFacts(data.facts);
        setOptions(data.options);
      }
    } catch (error) {
      console.error("Error loading new game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuess = async (destinationId: string) => {
    if (isCorrect !== null || !userId) return;

    setSelectedOption(destinationId);

    const correct = destinationId === currentDestination?.id;
    setIsCorrect(correct);

    // Get a random fact to display
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    setRevealedFact(randomFact);

    if (correct) {
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Update score
      setScore((prev) => prev + 10);
      setCorrectGuesses((prev) => prev + 1);
    } else {
      setIncorrectGuesses((prev) => prev + 1);
    }

    // Save the result
    try {
      await fetch("/api/game/result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          destinationId: currentDestination?.id,
          isCorrect: correct,
        }),
      });
    } catch (error) {
      console.error("Error saving game result:", error);
    }
  };

  const handleChallengeClick = async () => {
    if (!userId) return;

    try {
      const response = await fetch("/api/challenge/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Create share text
        const shareText = `I challenge you to beat my score of ${score} in Globetrotter! Can you guess these famous destinations? Play here: ${window.location.origin}/challenge/${data.inviteCode}`;

        // Open share dialog
        if (navigator.share) {
          await navigator.share({
            title: "Globetrotter Challenge",
            text: shareText,
            url: `${window.location.origin}/challenge/${data.inviteCode}`,
          });
        } else {
          // Fallback for browsers that don't support the Web Share API
          alert(
            `Share this link with your friends: ${window.location.origin}/challenge/${data.inviteCode}`
          );
        }
      }
    } catch (error) {
      console.error("Error creating challenge:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🌍</span>
            <h1 className="text-xl font-bold text-white">GLOBETROTTER</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-white">
              <span className="font-bold">{username}</span>
              <div className="text-sm">
                Score: <span className="font-bold">{score}</span> | Correct:{" "}
                <span className="text-green-300">{correctGuesses}</span> |
                Incorrect:{" "}
                <span className="text-red-300">{incorrectGuesses}</span>
              </div>
            </div>
            <button
              onClick={handleChallengeClick}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
            >
              Challenge a Friend
            </button>
          </div>
        </header>

        {/* Game Content */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Clue Section */}
          <div className="bg-blue-600 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Where am I?</h2>
            <div className="bg-white bg-opacity-10 rounded-lg p-4 text-white">
              {clues.slice(0, 2).map((clue) => (
                <p key={clue.id} className="mb-2 last:mb-0">
                  <span className="font-bold">🧩 Clue:</span> {clue.text}
                </p>
              ))}
            </div>
          </div>

          {/* Options Section */}
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select the correct destination:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleGuess(option.id)}
                  disabled={isCorrect !== null}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedOption === option.id
                      ? isCorrect
                        ? "border-green-500 bg-green-100"
                        : "border-red-500 bg-red-100"
                      : "border-gray-300 hover:border-blue-500"
                  } ${
                    isCorrect !== null && option.id === currentDestination?.id
                      ? "border-green-500 bg-green-100"
                      : ""
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>

            {/* Result Section */}
            {isCorrect !== null && (
              <div
                className={`p-4 rounded-lg mb-6 ${
                  isCorrect ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <h3
                  className={`text-lg font-bold ${
                    isCorrect ? "text-green-700" : "text-red-700"
                  } mb-2`}
                >
                  {isCorrect ? "🎉 Correct!" : "😢 Incorrect!"}
                </h3>
                <p className="text-gray-700">
                  {isCorrect
                    ? `Great job! You correctly identified ${currentDestination?.name}.`
                    : `The correct answer was ${currentDestination?.name}.`}
                </p>
                {revealedFact && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="text-gray-800">
                      <span className="font-bold">
                        {revealedFact.isTrivia
                          ? "🎲 Fun Fact:"
                          : "📚 Did you know:"}
                      </span>{" "}
                      {revealedFact.text}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Next Button */}
            {isCorrect !== null && (
              <button
                onClick={loadNewGame}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Next Destination
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
