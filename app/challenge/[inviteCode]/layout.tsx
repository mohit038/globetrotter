import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Globetrotter Challenge - Accept the Geography Challenge!",
  description:
    "You've been challenged to a game of Globetrotter! Test your geography knowledge against your friend.",
};

export default function ChallengeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
