
https://github.com/user-attachments/assets/6dece3f8-776c-44a2-a947-d92dda62d573
# 🌍 Globetrotter

Globetrotter is an interactive geography guessing game where players are challenged to identify destinations around the world based on clues. Players can challenge friends, track their scores, and learn interesting facts about global destinations.

Visit: https://globetrotter-phi.vercel.app/game


https://github.com/user-attachments/assets/090dbadc-d633-4f3e-b5b9-e35eba802a7a

## 🎮 Main Features

- **Geography Guessing Game**: Test your knowledge by identifying destinations based on clues
- **Challenge System**: Send challenges to friends with unique invite links
- **Score Tracking**: Keep track of correct and incorrect guesses
- **Interesting Facts**: Learn trivia and facts about destinations around the world
- **Responsive Design**: Play on any device with a fully responsive UI
- **Share Functionality**: Share challenges via native share, WhatsApp, or direct link
- **User Accounts**: Create a username and track your progress over time

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or pnpm
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mohit038/globetrotter.git
   cd globetrotter
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Copy the environment variables file:
   ```bash
   cp .env.example .env.local
   ```

4. Update the `.env.local` file with your database credentials.

5. Run the database migrations:
   ```bash
   npx prisma migrate dev
   ```

6. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔄 API Endpoints

### User Management

- **POST /api/users/create**
  - Creates a new user
  - Body: `{ username: string }`
  - Returns: User object with ID

- **GET /api/users/check?username=string**
  - Checks if a username is available
  - Query: `username`
  - Returns: `{ available: boolean }`

- **GET /api/users/[id]**
  - Gets user information by ID
  - Returns: User object with stats

### Game Management

- **GET /api/game/new?userId=string**
  - Starts a new game session for a user
  - Query: `userId`
  - Returns: Game session with challenge, clues, and options

- **GET /api/game/challenge?userId=string&challengeId=string**
  - Loads a specific challenge for a user
  - Query: `userId`, `challengeId`
  - Returns: Game session with challenge details

- **POST /api/game/result**
  - Submits a guess for a game session
  - Body: `{ userId: string, sessionId: string, destinationId: string }`
  - Returns: Result with correctness and correct destination if wrong

### Challenge Management

- **POST /api/challenge/create**
  - Creates a new challenge invite
  - Body: `{ userId: string }`
  - Returns: Challenge with invite code

- **GET /api/challenge/[inviteCode]**
  - Gets challenge information by invite code
  - Returns: Challenge details

- **PUT /api/challenge/update**
  - Updates a challenge (e.g., mark as inactive)
  - Body: `{ challengeId: string, isActive: boolean }`
  - Returns: Updated challenge

## 📊 Database Schema

### User
- `id`: Unique identifier (UUID)
- `username`: Unique username
- `score`: Total score
- `correctGuesses`: Number of correct guesses
- `incorrectGuesses`: Number of incorrect guesses
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

### Destination
- `id`: Unique identifier (UUID)
- `name`: Unique destination name
- `createdById`: ID of user who created the destination
- `updatedById`: ID of user who last updated the destination
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

### Clue
- `id`: Unique identifier (UUID)
- `text`: Clue text
- `difficulty`: Difficulty level (easy, medium, hard)
- `destinationId`: ID of associated destination

### Fact
- `id`: Unique identifier (UUID)
- `text`: Fact text
- `isTrivia`: Whether the fact is trivia
- `destinationId`: ID of associated destination

### GameSession
- `id`: Unique identifier (UUID)
- `userId`: ID of the user playing
- `isCorrect`: Whether the guess was correct (null if not answered)
- `challengeId`: ID of the challenge being played
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

### Challenge
- `id`: Unique identifier (UUID)
- `destinationId`: ID of the destination to guess
- `isActive`: Whether the challenge is active
- `createdById`: ID of user who created the challenge
- `updatedById`: ID of user who last updated the challenge
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

### Invite
- `id`: Unique identifier (UUID)
- `challengeId`: ID of the associated challenge
- `senderId`: ID of the user who sent the invite
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

## 🛠️ Technologies Used

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Deployment**: Vercel
- **Image Generation**: html2canvas
- **Animation**: canvas-confetti

## 📱 Share Functionality

Globetrotter provides multiple ways to share challenges:
- **Native Share**: Uses the Web Share API for mobile devices
- **WhatsApp Share**: Direct sharing to WhatsApp
- **Copy Link**: Copy invite link to clipboard
- **Share Image**: Generates a custom share card image

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- mohit038


---
name: Vercel Postgres + Prisma Next.js Starter
slug: postgres-prisma
description: Simple Next.js template that uses Vercel Postgres as the database and Prisma as the ORM.
framework: Next.js
useCase: Starter
css: Tailwind
database: Vercel Postgres
deployUrl: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fexamples%2Ftree%2Fmain%2Fstorage%2Fpostgres-prisma&project-name=postgres-prisma&repository-name=postgres-prisma&demo-title=Vercel%20Postgres%20%2B%20Prisma%20Next.js%20Starter&demo-description=Simple%20Next.js%20template%20that%20uses%20Vercel%20Postgres%20as%20the%20database%20and%20Prisma%20as%20the%20ORM.&demo-url=https%3A%2F%2Fpostgres-prisma.vercel.app%2F&demo-image=https%3A%2F%2Fpostgres-prisma.vercel.app%2Fopengraph-image.png&stores=%5B%7B"type"%3A"postgres"%7D%5D
demoUrl: https://postgres-prisma.vercel.app/
relatedTemplates:
  - postgres-starter
  - postgres-kysely
  - postgres-sveltekit
---
