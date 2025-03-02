import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. User ID is required" },
        { status: 401 }
      );
    }

    const availableChallenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        id: {
          notIn: await prisma.gameSession
            .findMany({
              where: { userId, isCorrect: true },
              select: { challengeId: true },
            })
            .then((sessions) => sessions.map((s) => s.challengeId)),
        },
      },
      include: {
        destination: true,
      },
      take: 10,
    });

    if (availableChallenges.length === 0) {
      return NextResponse.json(
        {
          message: "No more challenges available",
          allCompleted: true,
        },
        { status: 200 }
      );
    }

    const randomIndex = Math.floor(Math.random() * availableChallenges.length);
    const selectedChallenge = availableChallenges[randomIndex];

    const selectedDestination = await prisma.destination.findUnique({
      where: { id: selectedChallenge.destinationId },
      include: {
        clues: true,
        facts: true,
      },
    });

    if (!selectedDestination) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    const allDestinations = await prisma.destination.findMany({
      select: {
        id: true,
        name: true,
      },
      take: 10,
    });

    // Create options (1 correct + 3 random incorrect)
    const incorrectDestinations = allDestinations
      .filter((dest) => dest.id !== selectedDestination.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Ensure all options are of the same type (objects with id and name)
    const options = [
      { id: selectedDestination.id, name: selectedDestination.name },
      ...incorrectDestinations,
    ].sort(() => 0.5 - Math.random()); // Shuffle options

    const gameSession = await prisma.gameSession.create({
      data: {
        userId,
        challengeId: selectedChallenge.id,
      },
    });

    return NextResponse.json({
      challengeId: selectedChallenge.id,
      clues: selectedDestination.clues,
      facts: selectedDestination.facts,
      options,
      gameSessionId: gameSession.id,
    });
  } catch (error) {
    console.error("Error creating new game:", error);
    return NextResponse.json(
      { error: "Failed to create new game" },
      { status: 500 }
    );
  }
}
