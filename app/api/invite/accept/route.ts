import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { inviteCode, userId } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

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

    // Find invite by invite code
    const invite = await prisma.invite.findUnique({
      where: { inviteCode },
      include: {
        challenge: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.isAccepted) {
      return NextResponse.json(
        { error: "Invite has already been accepted" },
        { status: 400 }
      );
    }

    // Check if user has already played this destination in a single query
    const existingSession = await prisma.gameSession.findFirst({
      where: {
        userId,
        destinationId: invite.challenge.destinationId,
      },
    });

    if (existingSession) {
      return NextResponse.json(
        { error: "You have already played this destination" },
        { status: 400 }
      );
    }

    // Check if user has already played this challenge
    const existingChallengeSession = await prisma.gameSession.findFirst({
      where: {
        userId,
        challengeId: invite.challengeId,
      },
    });

    if (existingChallengeSession) {
      return NextResponse.json(
        { error: "You have already played this challenge" },
        { status: 400 }
      );
    }

    // Update invite to mark as accepted and set recipient if not already set
    const updatedInvite = await prisma.invite.update({
      where: { id: invite.id },
      data: {
        isAccepted: true,
        recipientId: invite.recipientId || userId,
      },
    });

    // Create a game session for this challenge
    const gameSession = await prisma.gameSession.create({
      data: {
        userId,
        destinationId: invite.challenge.destinationId,
        challengeId: invite.challengeId,
      },
    });

    return NextResponse.json({
      success: true,
      invite: {
        id: updatedInvite.id,
        isAccepted: updatedInvite.isAccepted,
      },
      gameSession: {
        id: gameSession.id,
      },
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
