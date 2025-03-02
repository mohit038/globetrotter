"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUsername = localStorage.getItem("globetrotter_username");
    if (storedUsername) {
      router.push("/game");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Check if username exists
      const response = await fetch("/api/users/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      if (data.user) {
        localStorage.setItem("globetrotter_username", username);
        localStorage.setItem("globetrotter_userId", data.user.id);
        router.push("/game");
      }

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
        setIsLoading(false);
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
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center">
            <span className="mr-2">🌍</span> GLOBETROTTER
          </h1>
          <p className="text-blue-100 mt-2">
            The Ultimate Travel Guessing Game
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Enter Username
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
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Start Playing"}
            </button>
          </form>

          <div className="mt-4">
            <button
              onClick={() => {
                // Show how to play modal or navigate to instructions
                alert(
                  "How to Play: You will be given clues about a famous destination. Try to guess which place it is! The faster you guess, the more points you earn."
                );
              }}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              How to Play
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-white text-sm">
        <p>Challenge your friends to see who knows the world better!</p>
      </footer>
    </main>
  );
}
