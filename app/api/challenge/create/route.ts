import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
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

    // Check if the user already has an invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        senderId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // If there's an existing invite, return it
    if (existingInvite) {
      return NextResponse.json({
        inviteCode: existingInvite.id,
        createdAt: existingInvite.createdAt,
      });
    }

    // Get any active challenge - we don't care which one
    const challenge = await prisma.challenge.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "No available challenges found" },
        { status: 404 }
      );
    }

    // Generate a unique invite code
    const inviteCode = randomBytes(8).toString("hex");

    // Create a public invite that anyone can use
    const invite = await prisma.invite.create({
      data: {
        id: inviteCode,
        challengeId: challenge.id,
        senderId: userId,
      },
    });

    return NextResponse.json({
      inviteCode: invite.id,
      createdAt: invite.createdAt,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
