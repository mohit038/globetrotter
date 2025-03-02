import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { inviteCode: string } }
) {
  try {
    const inviteCode = params.inviteCode;

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    // Find invite by ID (which is the invite code)
    const invite = await prisma.invite.findUnique({
      where: { id: inviteCode },
      include: {
        challenge: {
          include: {
            destination: true,
          },
        },
        sender: true,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Challenge invite not found" },
        { status: 404 }
      );
    }

    // Check if the challenge is still active
    if (!invite.challenge.isActive) {
      return NextResponse.json(
        { error: "This challenge is no longer active" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      inviteCode: invite.id,
      createdAt: invite.createdAt,
      challenge: {
        id: invite.challenge.id,
        isActive: invite.challenge.isActive,
        destination: {
          name: invite.challenge.destination.name,
        },
      },
      challenger: {
        id: invite.sender.id,
        username: invite.sender.username,
        score: invite.sender.score,
        correctGuesses: invite.sender.correctGuesses,
        incorrectGuesses: invite.sender.incorrectGuesses,
      },
    });
  } catch (error) {
    console.error("Error fetching challenge invite:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenge invite" },
      { status: 500 }
    );
  }
}
