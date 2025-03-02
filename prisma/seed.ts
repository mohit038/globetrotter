import prisma from "../lib/prisma";

async function main() {
  // Clear existing data
  await prisma.gameSession.deleteMany({});
  await prisma.invite.deleteMany({});
  await prisma.challenge.deleteMany({});
  await prisma.clue.deleteMany({});
  await prisma.fact.deleteMany({});
  await prisma.destination.deleteMany({});
  await prisma.user.deleteMany({});

  // Create a system user first
  const systemUser = await prisma.user.create({
    data: {
      username: "system",
      score: 0,
      correctGuesses: 0,
      incorrectGuesses: 0,
    },
  });

  // Create initial destinations
  const destinations = [
    {
      name: "Eiffel Tower",
      clues: [
        { text: "I was built for a World Fair in 1889", difficulty: "medium" },
        {
          text: "I was once the tallest man-made structure in the world",
          difficulty: "medium",
        },
        {
          text: "I am made of iron and located in a European capital",
          difficulty: "easy",
        },
      ],
      facts: [
        {
          text: "The Eiffel Tower was originally intended to be a temporary structure",
          isTrivia: false,
        },
        {
          text: "It takes 20,000 light bulbs to make the Eiffel Tower sparkle at night",
          isTrivia: true,
        },
        {
          text: "The Eiffel Tower grows in summer! Heat makes the iron expand, making the tower up to 15 cm taller",
          isTrivia: true,
        },
      ],
    },
    {
      name: "Taj Mahal",
      clues: [
        {
          text: "I was built as a mausoleum by an emperor for his favorite wife",
          difficulty: "medium",
        },
        {
          text: "I am made of white marble and change color throughout the day",
          difficulty: "medium",
        },
        {
          text: "I am located on the banks of the Yamuna River",
          difficulty: "hard",
        },
      ],
      facts: [
        {
          text: "The Taj Mahal took approximately 22 years to complete",
          isTrivia: false,
        },
        {
          text: "Over 20,000 workers and 1,000 elephants were used to build the Taj Mahal",
          isTrivia: true,
        },
        {
          text: "The Taj Mahal is perfectly symmetrical in every way, except for the placement of the cenotaphs",
          isTrivia: true,
        },
      ],
    },
    {
      name: "Great Wall of China",
      clues: [
        {
          text: "I am over 13,000 miles long and can be seen from space",
          difficulty: "easy",
        },
        {
          text: "I was built to protect an ancient empire from nomadic invaders",
          difficulty: "medium",
        },
        {
          text: "My construction began over 2,000 years ago",
          difficulty: "medium",
        },
      ],
      facts: [
        {
          text: "The Great Wall of China is not a single wall but a collection of walls built by different dynasties",
          isTrivia: false,
        },
        {
          text: "It would take approximately 18 months to walk the entire length of the Great Wall",
          isTrivia: true,
        },
        {
          text: "Over 1 million people died during the construction of the Great Wall",
          isTrivia: true,
        },
      ],
    },
    {
      name: "Machu Picchu",
      clues: [
        {
          text: "I am an ancient citadel set high in the mountains",
          difficulty: "medium",
        },
        {
          text: "I was built by the Inca civilization in the 15th century",
          difficulty: "medium",
        },
        {
          text: 'I was "rediscovered" by Hiram Bingham in 1911',
          difficulty: "hard",
        },
      ],
      facts: [
        {
          text: "Machu Picchu was built without the use of wheels, iron tools, or mortar",
          isTrivia: false,
        },
        {
          text: "The stones in Machu Picchu are so precisely cut that a knife blade cannot fit between them",
          isTrivia: true,
        },
        {
          text: "Machu Picchu has over 100 separate flights of stairs, many of which were carved from a single slab of stone",
          isTrivia: true,
        },
      ],
    },
    {
      name: "Statue of Liberty",
      clues: [
        {
          text: "I was a gift from France to the United States",
          difficulty: "medium",
        },
        {
          text: "I hold a torch in my right hand and a tablet in my left",
          difficulty: "easy",
        },
        {
          text: "I am made of copper that has turned green over time",
          difficulty: "medium",
        },
      ],
      facts: [
        {
          text: "The Statue of Liberty was delivered in 350 pieces packed in 214 crates",
          isTrivia: false,
        },
        {
          text: "The seven spikes on the crown represent the seven seas and seven continents",
          isTrivia: true,
        },
        {
          text: 'The Statue of Liberty\'s full name is "Liberty Enlightening the World"',
          isTrivia: true,
        },
      ],
    },
  ];

  for (const destination of destinations) {
    const createdDestination = await prisma.destination.create({
      data: {
        name: destination.name,
        createdById: systemUser.id,
      },
    });

    for (const clue of destination.clues) {
      await prisma.clue.create({
        data: {
          text: clue.text,
          difficulty: clue.difficulty,
          destinationId: createdDestination.id,
        },
      });
    }

    for (const fact of destination.facts) {
      await prisma.fact.create({
        data: {
          text: fact.text,
          isTrivia: fact.isTrivia,
          destinationId: createdDestination.id,
        },
      });
    }

    // Create a default challenge for this destination
    await prisma.challenge.create({
      data: {
        createdById: systemUser.id,
        destinationId: createdDestination.id,
        isActive: true,
      },
    });
  }

  // Create a demo user
  await prisma.user.create({
    data: {
      username: "demouser",
      score: 0,
      correctGuesses: 0,
      incorrectGuesses: 0,
    },
  });

  console.log("Database has been seeded!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
