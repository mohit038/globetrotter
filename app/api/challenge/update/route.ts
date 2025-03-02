import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const { challengeId, isActive } = await request.json();

    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required" },
        { status: 400 }
      );
    }

    if (isActive === undefined) {
      return NextResponse.json(
        { error: "isActive status is required" },
        { status: 400 }
      );
    }

    // Check if challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Update challenge
    const updatedChallenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: { isActive },
    });

    return NextResponse.json({
      id: updatedChallenge.id,
      isActive: updatedChallenge.isActive,
    });
  } catch (error) {
    console.error("Error updating challenge:", error);
    return NextResponse.json(
      { error: "Failed to update challenge" },
      { status: 500 }
    );
  }
}
