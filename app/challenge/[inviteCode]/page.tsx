"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ChallengerInfo {
  id: string;
  username: string;
  score: number;
  correctGuesses: number;
  incorrectGuesses: number;
}

interface ChallengeInfo {
  id: string;
  isActive: boolean;
  destination: {
    name: string;
  };
}

export default function ChallengePage({
  params,
}: {
  params: { inviteCode: string };
}) {
  const [challenger, setChallenger] = useState<ChallengerInfo | null>(null);
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [isOwnInvite, setIsOwnInvite] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const router = useRouter();
  const { inviteCode } = params;

  useEffect(() => {
    // Check if user is already logged in
    const storedUsername = localStorage.getItem("globetrotter_username");
    const storedUserId = localStorage.getItem("globetrotter_userId");

    if (storedUsername && storedUserId) {
      setCurrentUser({
        id: storedUserId,
        username: storedUsername,
      });
    }

    // Fetch challenge info
    const fetchChallengeInfo = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/challenge/${inviteCode}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Challenge not found");
        }

        setChallenger(data.challenger);
        setChallenge(data.challenge);

        // Check if the challenge is active
        if (data.challenge && !data.challenge.isActive) {
          setError("This challenge is no longer active.");
          return;
        }

        // Check if the current user is the challenger
        if (
          storedUserId &&
          data.challenger &&
          storedUserId === data.challenger.id
        ) {
          setIsOwnInvite(true);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("This challenge link is invalid or has expired.");
        }
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

      // Accept the challenge and redirect to game page
      acceptChallenge(createData.id);
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const acceptChallenge = async (userId: string) => {
    if (!challenge) return;

    // Check if the challenge is active before proceeding
    if (!challenge.isActive) {
      setError("This challenge is no longer active.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Store the challenge ID in localStorage so the game page can load it
      localStorage.setItem("globetrotter_currentChallenge", challenge.id);

      // Redirect to game page
      router.push("/game");
    } catch (err) {
      console.error("Error accepting challenge:", err);
      setError("Failed to accept the challenge");
      setIsSubmitting(false);
    }
  };

  const handlePlayNow = () => {
    if (!currentUser || !currentUser.id) return;

    // Check if the challenge is active before proceeding
    if (challenge && !challenge.isActive) {
      setError("This challenge is no longer active.");
      return;
    }

    setIsSubmitting(true);
    acceptChallenge(currentUser.id);
  };

  const copyToClipboard = async () => {
    if (!window.location.href) return;

    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const shareInvite = async () => {
    if (!window.location.href) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Globetrotter Challenge",
          text: `I challenge you to guess this destination in Globetrotter! Can you beat my score?`,
          url: window.location.href,
        });
      } else {
        copyToClipboard();
      }
    } catch (error) {
      console.error("Error sharing:", error);
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

  // Show a different UI if the user is viewing their own invite
  if (isOwnInvite) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-blue-600 p-6 text-center">
            <h1 className="text-3xl font-bold text-white flex items-center justify-center">
              <span className="mr-2">🌍</span> GLOBETROTTER
            </h1>
            <p className="text-blue-100 mt-2">Your Challenge Invite</p>
          </div>

          <div className="p-6">
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🔗</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
                This is your challenge link!
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Share this link with friends to challenge them to guess the
                destination.
              </p>
            </div>

            <div className="bg-gray-100 p-3 rounded-md mb-6 break-all">
              <p className="text-sm text-gray-800">{window.location.href}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={copyToClipboard}
                className="w-full px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                {isCopied ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-green-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>

              <button
                onClick={shareInvite}
                className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                Share Challenge
              </button>

              <Link
                href="/game"
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-center mt-2"
              >
                Return to Game
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center">
            <span className="mr-2">🌍</span> GLOBETROTTER
          </h1>
          <p className="text-blue-100 mt-2">Challenge Invitation</p>
        </div>

        <div className="p-6">
          {challenger && challenge && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-gray-700 mb-2">
                <span className="font-bold">{challenger.username}</span> has
                challenged you to guess a destination!
              </p>

              <div className="mt-3 bg-white p-3 rounded-md border border-gray-200">
                <h3 className="font-medium text-gray-800 mb-2">
                  Challenger Stats:
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-blue-600 font-bold">
                      {challenger.score}
                    </div>
                    <div className="text-xs text-gray-600">Score</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-green-600 font-bold">
                      {challenger.correctGuesses}
                    </div>
                    <div className="text-xs text-gray-600">Correct</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <div className="text-red-600 font-bold">
                      {challenger.incorrectGuesses}
                    </div>
                    <div className="text-xs text-gray-600">Incorrect</div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mt-4 font-medium">
                Can you beat their score?
              </p>
            </div>
          )}

          {currentUser ? (
            <div className="text-center">
              <p className="mb-4 text-gray-700">
                You&apos;re logged in as{" "}
                <span className="font-bold">{currentUser.username}</span>
              </p>
              <button
                onClick={handlePlayNow}
                disabled={
                  isSubmitting || (challenge ? !challenge.isActive : false)
                }
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 mb-3"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Loading...</span>
                  </div>
                ) : challenge && !challenge.isActive ? (
                  "Challenge Inactive"
                ) : (
                  "Play Challenge Now"
                )}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Not you?{" "}
                <button
                  onClick={() => {
                    localStorage.removeItem("globetrotter_username");
                    localStorage.removeItem("globetrotter_userId");
                    setCurrentUser(null);
                    setIsOwnInvite(false);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Sign out
                </button>
              </p>
            </div>
          ) : (
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
                disabled={
                  isSubmitting || (challenge ? !challenge.isActive : false)
                }
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Loading...</span>
                  </div>
                ) : challenge && !challenge.isActive ? (
                  "Challenge Inactive"
                ) : (
                  "Accept Challenge"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
