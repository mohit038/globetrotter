import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get all destinations
    const allDestinations = await prisma.destination.findMany();

    if (allDestinations.length < 4) {
      return NextResponse.json(
        { error: "Not enough destinations in the database" },
        { status: 500 }
      );
    }

    // Select a random destination
    const randomIndex = Math.floor(Math.random() * allDestinations.length);
    const selectedDestination = allDestinations[randomIndex];

    // Get clues for the selected destination
    const clues = await prisma.clue.findMany({
      where: { destinationId: selectedDestination.id },
    });

    // Get facts for the selected destination
    const facts = await prisma.fact.findMany({
      where: { destinationId: selectedDestination.id },
    });

    // Create options (1 correct + 3 random incorrect)
    const incorrectDestinations = allDestinations
      .filter((dest: any) => dest.id !== selectedDestination.id)
      .sort(() => 0.5 - Math.random()) // Shuffle
      .slice(0, 3); // Take 3 random destinations

    const options = [selectedDestination, ...incorrectDestinations].sort(
      () => 0.5 - Math.random()
    ); // Shuffle options

    return NextResponse.json({
      destination: selectedDestination,
      clues,
      facts,
      options,
    });
  } catch (error) {
    console.error("Error creating new game:", error);
    return NextResponse.json(
      { error: "Failed to create new game" },
      { status: 500 }
    );
  }
}
