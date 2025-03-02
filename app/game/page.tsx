"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Metadata } from "next";
import html2canvas from "html2canvas";

// This metadata won't work in a client component, so we'll need to create a layout file
// for the game page to properly set the metadata

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

  const [clues, setClues] = useState<Clue[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [options, setOptions] = useState<Destination[]>([]);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [allDestinationsCompleted, setAllDestinationsCompleted] =
    useState(false);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [revealedFact, setRevealedFact] = useState<Fact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [correctDestinationId, setCorrectDestinationId] = useState<
    string | null
  >(null);
  const [isCheckingGuess, setIsCheckingGuess] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [isSendingChallenge, setIsSendingChallenge] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Refs for capturing elements
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Add a ref to track initial load
  const initialLoadComplete = useRef(false);

  const router = useRouter();

  useEffect(() => {
    console.log("🔍 useEffect triggered");

    // Prevent double loading
    if (initialLoadComplete.current) {
      console.log("⏭️ Skipping duplicate load");
      return;
    }

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
    console.log("📊 Fetching stats for userId:", storedUserId);

    // Check if we're coming from a challenge
    const currentChallenge = localStorage.getItem(
      "globetrotter_currentChallenge"
    );

    if (currentChallenge) {
      // Load the specific challenge
      console.log("🎮 Loading specific challenge:", currentChallenge);
      loadSpecificChallenge(storedUserId, currentChallenge);
      // Clear the current challenge from localStorage
      localStorage.removeItem("globetrotter_currentChallenge");
    } else {
      // Load a new game
      console.log("🎮 Initial game load for userId:", storedUserId);
      loadNewGame(storedUserId);
    }

    // Mark initial load as complete
    initialLoadComplete.current = true;
  }, [router]); // Add router back to dependencies

  const fetchUserStats = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setScore(data.score);
        setCorrectGuesses(data.correctGuesses);
        setIncorrectGuesses(data.incorrectGuesses);
      } else {
        // If user not found, clear localStorage and redirect to home
        console.error("User not found in fetchUserStats");
        localStorage.removeItem("globetrotter_username");
        localStorage.removeItem("globetrotter_userId");
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const loadNewGame = async (providedUserId?: string) => {
    console.log("🔄 loadNewGame called with providedUserId:", providedUserId);
    setIsLoading(true);
    setSelectedOption(null);
    setIsCorrect(null);
    setRevealedFact(null);
    setCorrectDestinationId(null);

    try {
      // Use the provided userId or fall back to the state value
      const userIdToUse = providedUserId || userId;
      console.log("👤 Using userId:", userIdToUse);

      if (!userIdToUse) {
        console.error("User ID is missing");
        setIsLoading(false);
        return;
      }

      // Verify the user exists first
      const userResponse = await fetch(`/api/users/${userIdToUse}`);
      if (!userResponse.ok) {
        console.error("User not found or invalid");
        // Clear localStorage and redirect to home page if user is invalid
        localStorage.removeItem("globetrotter_username");
        localStorage.removeItem("globetrotter_userId");
        router.push("/");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/game/new?userId=${userIdToUse}`);

      if (response.ok) {
        const data = await response.json();

        if (data.allCompleted) {
          setAllDestinationsCompleted(true);
          setChallengeId(null);
          setClues([]);
          setFacts([]);
          setOptions([]);
          return;
        }

        setChallengeId(data.challengeId);
        setClues(data.clues);
        setFacts(data.facts);
        setOptions(data.options);
        setGameSessionId(data.gameSessionId);
      } else {
        // Handle API errors
        const errorData = await response.json();
        console.error("Error loading game:", errorData);

        // If there's a foreign key constraint error, the user might be invalid
        if (
          errorData.error &&
          errorData.error.includes("foreign key constraint")
        ) {
          // Clear local storage and redirect to home
          localStorage.removeItem("globetrotter_username");
          localStorage.removeItem("globetrotter_userId");
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error loading new game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpecificChallenge = async (userId: string, challengeId: string) => {
    console.log(
      "🔄 loadSpecificChallenge called with userId:",
      userId,
      "challengeId:",
      challengeId
    );
    setIsLoading(true);
    setSelectedOption(null);
    setIsCorrect(null);
    setRevealedFact(null);
    setCorrectDestinationId(null);

    try {
      // Verify the user exists first
      const userResponse = await fetch(`/api/users/${userId}`);
      if (!userResponse.ok) {
        console.error("User not found or invalid");
        // Clear localStorage and redirect to home page if user is invalid
        localStorage.removeItem("globetrotter_username");
        localStorage.removeItem("globetrotter_userId");
        router.push("/");
        setIsLoading(false);
        return;
      }

      // Load the specific challenge
      const response = await fetch(
        `/api/game/challenge?userId=${userId}&challengeId=${challengeId}`
      );

      if (response.ok) {
        const data = await response.json();
        setChallengeId(data.challengeId);
        setClues(data.clues);
        setFacts(data.facts);
        setOptions(data.options);
        setGameSessionId(data.gameSessionId);
      } else {
        // If the challenge can't be loaded, fall back to a new game
        console.error(
          "Failed to load specific challenge, falling back to new game"
        );
        loadNewGame(userId);
      }
    } catch (error) {
      console.error("Error loading specific challenge:", error);
      // Fall back to a new game
      loadNewGame(userId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuess = async (destinationId: string) => {
    if (isCorrect !== null || !userId || !gameSessionId || isCheckingGuess)
      return;

    try {
      setSelectedOption(destinationId);
      setIsCheckingGuess(true);

      const response = await fetch("/api/game/result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          sessionId: gameSessionId,
          destinationId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Add a small delay to make the loading animation visible
        await new Promise((resolve) => setTimeout(resolve, 800));

        setIsCorrect(data.isCorrect);

        // Store the correct destination ID if the guess was incorrect
        if (!data.isCorrect && data.correctDestinationId) {
          setCorrectDestinationId(data.correctDestinationId);
        }

        // Get a random fact to display
        const randomFact = facts[Math.floor(Math.random() * facts.length)];
        setRevealedFact(randomFact);

        if (data.isCorrect) {
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
      }
    } catch (error) {
      console.error("Error saving game result:", error);
    } finally {
      setIsCheckingGuess(false);
    }
  };

  const handleChallengeClick = async () => {
    setShowChallengeModal(true);
    setChallengeError(null);

    // Generate invite link immediately when modal is opened
    if (!inviteUrl) {
      generateInviteLink();
    }
  };

  const generateInviteLink = async () => {
    if (!userId) return;

    setIsSendingChallenge(true);
    setChallengeError(null);

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
        // Generate the invite URL
        const url = `${window.location.origin}/challenge/${data.inviteCode}`;
        setInviteUrl(url);
      } else {
        // Handle error cases
        const errorData = await response.json();
        console.error("Failed to create challenge:", errorData);

        // Set specific error message for all caught up scenario
        if (errorData.error === "No available challenges found") {
          setChallengeError(
            "No active challenges available to share. Check back later for new destinations!"
          );
        } else {
          setChallengeError("Failed to create challenge. Please try again.");
        }
        setInviteUrl(null);
      }
    } catch (error) {
      console.error("Error creating challenge:", error);
      setChallengeError("An error occurred. Please try again.");
      setInviteUrl(null);
    } finally {
      setIsSendingChallenge(false);
    }
  };

  const copyToClipboard = async () => {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const shareInvite = async () => {
    if (!inviteUrl) return;

    try {
      // Only try to generate the share image if the ref exists and we don't already have an image
      if (!shareImage && shareCardRef.current) {
        try {
          await generateShareImage();
        } catch (imageError) {
          console.error("Failed to generate share image:", imageError);
          // Continue with sharing even if image generation fails
        }
      }

      // Use Web Share API if available
      if (navigator.share) {
        try {
          const shareData: ShareData = {
            title: "Globetrotter Challenge",
            text: `I challenge you to guess this destination in Globetrotter! Can you beat my score?`,
            url: inviteUrl,
          };

          // Only add the image if it was successfully generated
          if (
            shareImage &&
            navigator.canShare &&
            navigator.canShare({
              files: [
                new File([shareImage], "challenge.png", { type: "image/png" }),
              ],
            })
          ) {
            try {
              const blob = await (await fetch(shareImage)).blob();
              const file = new File([blob], "challenge.png", {
                type: "image/png",
              });
              shareData.files = [file];
            } catch (fileError) {
              console.error("Error creating share file:", fileError);
              // Continue without the image
            }
          }

          await navigator.share(shareData);
        } catch (shareError) {
          console.error("Error sharing with navigator.share:", shareError);
          // Fall back to clipboard if sharing fails
          copyToClipboard();
        }
      } else {
        // Fallback to copying to clipboard
        copyToClipboard();
        alert(
          "Link copied to clipboard! You can now paste it to share with friends."
        );
      }
    } catch (error) {
      console.error("Error in shareInvite:", error);
      // Ultimate fallback
      copyToClipboard();
      alert(
        "Link copied to clipboard! You can now paste it to share with friends."
      );
    }
  };

  const generateShareImage = async () => {
    if (!shareCardRef.current) return;

    setIsGeneratingImage(true);

    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        allowTaint: true,
        useCORS: true,
      });

      const imageUrl = canvas.toDataURL("image/png");
      setShareImage(imageUrl);
      return imageUrl;
    } catch (error) {
      console.error("Error generating share image:", error);
      throw error;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const shareToWhatsApp = () => {
    if (!inviteUrl) return;

    const text = `🌍 I challenge you to guess this destination in Globetrotter! Can you beat my score? ${inviteUrl}`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;

    window.open(whatsappUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show "caught up" screen when all destinations are completed
  if (allDestinationsCompleted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="flex items-center mb-3 sm:mb-0">
                <span className="text-2xl mr-2">🌍</span>
                <h1 className="text-xl font-bold text-white">GLOBETROTTER</h1>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                <div className="text-white mb-3 sm:mb-0">
                  <span className="font-bold">{username}</span>
                  <div className="text-sm mt-1">
                    <span className="inline-block mr-2">
                      Score: <span className="font-bold">{score}</span>
                    </span>
                    <span className="inline-block mr-2">
                      Correct:{" "}
                      <span className="text-green-300">{correctGuesses}</span>
                    </span>
                    <span className="inline-block">
                      Incorrect:{" "}
                      <span className="text-red-300">{incorrectGuesses}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleChallengeClick}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md text-sm transition-colors w-full sm:w-auto"
                >
                  Invite a Friend
                </button>
              </div>
            </div>
          </header>

          {/* Caught Up Content */}
          <div className="bg-white rounded-lg shadow-xl overflow-hidden p-8 text-center">
            <div className="mb-6">
              <span className="text-6xl">🏆</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              You&apos;re All Caught Up!
            </h2>
            <p className="text-gray-600 mb-6">
              Congratulations! You&apos;ve explored all available destinations.
              <br />
              Check back later for new destinations to discover.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => {
                  // Reset the completed state and try to load a new game
                  // This allows for future destinations that might be added
                  setAllDestinationsCompleted(false);
                  loadNewGame();
                }}
                disabled={isLoading}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Checking...</span>
                  </div>
                ) : (
                  "Check for New Destinations"
                )}
              </button>
              <button
                onClick={() => {
                  // Clear user data from localStorage
                  localStorage.removeItem("globetrotter_username");
                  localStorage.removeItem("globetrotter_userId");
                  // Redirect to home page
                  router.push("/");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors"
              >
                Reset Game
              </button>
            </div>
          </div>
        </div>

        {/* Challenge Modal */}
        {showChallengeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Invite a Friend
              </h3>

              {isSendingChallenge ? (
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Generating invite link...</p>
                </div>
              ) : inviteUrl ? (
                <>
                  {/* Share Card Preview - This will be captured for the image */}
                  <div
                    ref={shareCardRef}
                    className="bg-gradient-to-b from-blue-500 to-purple-600 p-4 rounded-lg mb-4 text-white"
                  >
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-2">🌍</span>
                      <h1 className="text-xl font-bold">GLOBETROTTER</h1>
                    </div>
                    <p className="mb-2">
                      I challenge you to guess this destination!
                    </p>
                    <div className="bg-white bg-opacity-20 p-3 rounded-md">
                      <p className="text-sm">
                        <span className="font-bold">Player:</span> {username}
                      </p>
                      <p className="text-sm">
                        <span className="font-bold">Score:</span> {score}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">
                    Share this challenge with your friends:
                  </p>

                  <div className="bg-gray-100 p-3 rounded-md mb-6 break-all">
                    <p className="text-sm text-gray-800">{inviteUrl}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center"
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
                      onClick={shareToWhatsApp}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors flex items-center justify-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </button>

                    <button
                      onClick={shareInvite}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors flex items-center justify-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                      Share
                    </button>

                    <button
                      onClick={() => setShowChallengeModal(false)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="text-red-500 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-4 text-center">
                    {challengeError ||
                      "Failed to generate invite link. Please try again."}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowChallengeModal(false)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    );
  }

  // Show loading or error message if no destination is available but not marked as completed
  if (!challengeId && !allDestinationsCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600">
        <div className="text-white text-xl text-center p-4">
          <p className="mb-4">Unable to load destination data.</p>
          <button
            onClick={() => loadNewGame()}
            disabled={isLoading}
            className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors relative"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Loading...</span>
              </div>
            ) : (
              "Try Again"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center mb-3 sm:mb-0">
              <span className="text-2xl mr-2">🌍</span>
              <h1 className="text-xl font-bold text-white">GLOBETROTTER</h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <div className="text-white mb-3 sm:mb-0">
                <span className="font-bold">{username}</span>
                <div className="text-sm mt-1">
                  <span className="inline-block mr-2">
                    Score: <span className="font-bold">{score}</span>
                  </span>
                  <span className="inline-block mr-2">
                    Correct:{" "}
                    <span className="text-green-300">{correctGuesses}</span>
                  </span>
                  <span className="inline-block">
                    Incorrect:{" "}
                    <span className="text-red-300">{incorrectGuesses}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={handleChallengeClick}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md text-sm transition-colors w-full sm:w-auto"
              >
                Challenge a Friend
              </button>
            </div>
          </div>
        </header>

        {/* Challenge Modal */}
        {showChallengeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Challenge a Friend
              </h3>

              {isSendingChallenge ? (
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Generating invite link...</p>
                </div>
              ) : inviteUrl ? (
                <>
                  {/* Share Card Preview - This will be captured for the image */}
                  <div
                    ref={shareCardRef}
                    className="bg-gradient-to-b from-blue-500 to-purple-600 p-4 rounded-lg mb-4 text-white"
                  >
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-2">🌍</span>
                      <h1 className="text-xl font-bold">GLOBETROTTER</h1>
                    </div>
                    <p className="mb-2">
                      I challenge you to guess this destination!
                    </p>
                    <div className="bg-white bg-opacity-20 p-3 rounded-md">
                      <p className="text-sm">
                        <span className="font-bold">Player:</span> {username}
                      </p>
                      <p className="text-sm">
                        <span className="font-bold">Score:</span> {score}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">
                    Share this challenge with your friends:
                  </p>

                  <div className="bg-gray-100 p-3 rounded-md mb-6 break-all">
                    <p className="text-sm text-gray-800">{inviteUrl}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center"
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
                      onClick={shareToWhatsApp}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors flex items-center justify-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </button>

                    <button
                      onClick={shareInvite}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors flex items-center justify-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                      Share
                    </button>

                    <button
                      onClick={() => setShowChallengeModal(false)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="text-red-500 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-4 text-center">
                    {challengeError ||
                      "Failed to generate invite link. Please try again."}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowChallengeModal(false)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                  disabled={isCorrect !== null || isCheckingGuess}
                  className={`p-4 rounded-lg border-2 transition-all relative ${
                    selectedOption === option.id
                      ? isCorrect !== null
                        ? isCorrect
                          ? "border-green-500 bg-green-100"
                          : "border-red-500 bg-red-100"
                        : "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-500"
                  } ${
                    isCorrect !== null &&
                    options.find(
                      (opt) => isCorrect && opt.id === selectedOption
                    )?.id === option.id
                      ? "border-green-500 bg-green-100"
                      : ""
                  }`}
                >
                  {option.name}
                  {isCheckingGuess && selectedOption === option.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-lg">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
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
                    ? `Great job! You correctly identified ${
                        options.find((opt) => opt.id === selectedOption)?.name
                      }.`
                    : `The correct answer was ${
                        options.find((opt) => opt.id === correctDestinationId)
                          ?.name || "unknown"
                      }.`}
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
                onClick={() => loadNewGame()}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors relative"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Loading next destination...</span>
                  </div>
                ) : (
                  "Next Destination"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
