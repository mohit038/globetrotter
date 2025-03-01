import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId, destinationId, isCorrect } = await request.json();

    if (!userId || !destinationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create game session
    await prisma.gameSession.create({
      data: {
        userId,
        destinationId,
        isCorrect,
      },
    });

    // Update user stats
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving game result:", error);
    return NextResponse.json(
      { error: "Failed to save game result" },
      { status: 500 }
    );
  }
}
