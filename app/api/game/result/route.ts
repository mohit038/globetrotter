import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId, sessionId, destinationId } = await request.json();

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const gameSession = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        challenge: true,
      },
    });

    if (!gameSession) {
      return NextResponse.json(
        { error: "Game session not found" },
        { status: 404 }
      );
    }

    const isCorrect = gameSession.challenge.destinationId === destinationId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        score: isCorrect ? user.score + 10 : user.score,
        correctGuesses: isCorrect
          ? user.correctGuesses + 1
          : user.correctGuesses,
        incorrectGuesses: isCorrect
          ? user.incorrectGuesses
          : user.incorrectGuesses + 1,
      },
    });

    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { isCorrect },
    });

    if (isCorrect) {
      return NextResponse.json({ isCorrect });
    } else {
      return NextResponse.json({
        isCorrect,
        correctDestinationId: gameSession.challenge.destinationId,
      });
    }
  } catch (error) {
    console.error("Error saving game result:", error);
    return NextResponse.json(
      { error: "Failed to save game result" },
      { status: 500 }
    );
  }
}
