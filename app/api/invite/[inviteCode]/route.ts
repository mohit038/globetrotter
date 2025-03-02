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

    // Find invite by invite code
    const invite = await prisma.invite.findUnique({
      where: { inviteCode },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            score: true,
          },
        },
        challenge: {
          include: {
            destination: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: invite.id,
      inviteCode: invite.inviteCode,
      isAccepted: invite.isAccepted,
      createdAt: invite.createdAt,
      sender: invite.sender,
      challenge: {
        id: invite.challenge.id,
        destination: invite.challenge.destination,
      },
    });
  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 }
    );
  }
}
