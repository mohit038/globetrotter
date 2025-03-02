import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const { userId, challengeId, recipientId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    // Check if recipient exists if provided
    if (recipientId) {
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });

      if (!recipient) {
        return NextResponse.json(
          { error: "Recipient not found" },
          { status: 404 }
        );
      }
    }

    // Generate a unique invite code
    const inviteCode = randomBytes(6).toString("hex");

    // Create invite
    const invite = await prisma.invite.create({
      data: {
        challengeId,
        senderId: userId,
        recipientId,
        inviteCode,
        isAccepted: false,
      },
    });

    return NextResponse.json({
      id: invite.id,
      inviteCode: invite.inviteCode,
      challengeId: invite.challengeId,
      isAccepted: invite.isAccepted,
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
