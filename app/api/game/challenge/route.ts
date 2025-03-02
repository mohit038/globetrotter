import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const challengeId = searchParams.get("challengeId");

    if (!userId || !challengeId) {
      return NextResponse.json(
        { error: "User ID and Challenge ID are required" },
        { status: 400 }
      );
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the challenge exists and is active
    const challenge = await prisma.challenge.findUnique({
      where: {
        id: challengeId,
        isActive: true,
      },
      include: {
        destination: {
          include: {
            clues: true,
            facts: true,
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found or inactive" },
        { status: 404 }
      );
    }

    // Create a game session for this challenge
    const gameSession = await prisma.gameSession.create({
      data: {
        userId,
        challengeId,
      },
    });

    // Get all destinations for options
    const allDestinations = await prisma.destination.findMany({
      select: {
        id: true,
        name: true,
      },
      take: 10,
    });

    // Create options (1 correct + 3 random incorrect)
    const incorrectDestinations = allDestinations
      .filter((dest) => dest.id !== challenge.destination.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Ensure all options are of the same type (objects with id and name)
    const options = [
      { id: challenge.destination.id, name: challenge.destination.name },
      ...incorrectDestinations,
    ].sort(() => 0.5 - Math.random()); // Shuffle options

    return NextResponse.json({
      challengeId: challenge.id,
      clues: challenge.destination.clues,
      facts: challenge.destination.facts,
      options,
      gameSessionId: gameSession.id,
    });
  } catch (error) {
    console.error("Error loading challenge:", error);
    return NextResponse.json(
      { error: "Failed to load challenge" },
      { status: 500 }
    );
  }
}
