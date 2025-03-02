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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get played destination IDs
    const playedDestinationIds = await prisma.gameSession
      .findMany({
        where: { userId },
        select: { destinationId: true },
      })
      .then((sessions) => sessions.map((s) => s.destinationId));

    // Get played challenge IDs (ensuring non-null values)
    const playedSessions = await prisma.gameSession.findMany({
      where: {
        userId,
        challengeId: { not: null },
      },
      select: { challengeId: true },
    });

    // Filter out null values and extract the IDs
    const playedChallengeIds: string[] = playedSessions
      .map((s) => s.challengeId)
      .filter((id): id is string => id !== null);

    // Get active challenges that the user hasn't played and with destinations they haven't played
    const availableChallenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        id:
          playedChallengeIds.length > 0
            ? { notIn: playedChallengeIds }
            : undefined,
        destinationId:
          playedDestinationIds.length > 0
            ? { notIn: playedDestinationIds }
            : undefined,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            score: true,
          },
        },
        destination: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      challenges: availableChallenges.map((challenge) => ({
        id: challenge.id,
        createdAt: challenge.createdAt,
        creator: challenge.creator,
        destination: challenge.destination,
      })),
    });
  } catch (error) {
    console.error("Error fetching active challenges:", error);
    return NextResponse.json(
      { error: "Failed to fetch active challenges" },
      { status: 500 }
    );
  }
}
