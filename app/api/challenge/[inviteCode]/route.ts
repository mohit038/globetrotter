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

    // Find challenge by invite code
    const challenge = await prisma.challenge.findUnique({
      where: { inviteCode },
      include: {
        challenger: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: challenge.id,
      inviteCode: challenge.inviteCode,
      createdAt: challenge.createdAt,
      challenger: {
        id: challenge.challenger.id,
        username: challenge.challenger.username,
        score: challenge.challenger.score,
      },
    });
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenge" },
      { status: 500 }
    );
  }
}
