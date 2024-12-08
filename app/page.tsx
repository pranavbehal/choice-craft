/**
 * Home Page Component
 *
 * Main landing page displaying available missions and their current status.
 * Provides mission selection interface with visual cards and progress tracking.
 *
 * @component
 * @requires Authentication
 */

"use client";

import { Navigation } from "@/components/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { useRouter } from "next/navigation";
import { useDatabase } from "@/hooks/useDatabase";
import { type MissionProgress } from "@/types";

/** Available missions with their metadata */
const missions = [
  {
    id: "670a8cdc-8961-438b-b67f-1b259767d8c5",
    title: "The Lost City",
    description: "Uncover the secrets of an ancient civilization",
    companion: "Professor Blue",
    image: "/mission-images/mission-1.jpg",
  },
  {
    id: "b2fa59e6-d406-4c51-8b99-00e72c2a3a10",
    title: "Space Odyssey",
    description: "Navigate through an asteroid field in your spaceship",
    companion: "Captain Nova",
    image: "/mission-images/mission-2.jpg",
  },
  {
    id: "82761887-a4c7-4bd7-921a-4f0a3c18a558",
    title: "Enchanted Forest",
    description: "Break the curse hurting magical creatures",
    companion: "Fairy Lumi",
    image: "/mission-images/mission-3.jpg",
  },
  {
    id: "e5b455a2-9f57-448f-a0f9-7dd873fb0dfd",
    title: "Cyber Heist",
    description: "Infiltrate a high-security digital vault",
    companion: "Sergeant Nexus",
    image: "/mission-images/mission-4.jpg",
  },
];

export default function Home() {
  const router = useRouter();
  const handleProtectedAction = useProtectedAction();
  const { missionProgress } = useDatabase();

  /**
   * Handles mission selection and navigation
   * Requires authentication before proceeding
   * @param {string} missionId - ID of the selected mission
   */
  const handleMissionClick = (missionId: string) => {
    handleProtectedAction(() => {
      router.push(`/missions/${missionId}`);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight mb-12 text-center text-primary">
          Choose Your Adventure
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {missions.map((mission) => (
            <div
              key={mission.id}
              onClick={() => handleMissionClick(mission.id)}
              className="cursor-pointer transition-transform hover:scale-[1.02] duration-300"
            >
              <Card className="relative aspect-video overflow-hidden border border-border hover:border-primary group">
                <div className="absolute inset-0">
                  <Image
                    src={mission.image}
                    alt={mission.title}
                    fill
                    className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                  />
                </div>
                <div className="relative z-10 h-full flex flex-col p-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold tracking-tight mb-2 mt-2">
                      {mission.title}
                    </h2>
                    <p className="text-base text-muted-foreground">
                      {mission.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Badge
                        variant={
                          missionProgress?.find(
                            (p: MissionProgress) =>
                              p.mission_id === mission.id &&
                              p.completion_percentage === 100
                          )
                            ? "default"
                            : "secondary"
                        }
                        className="text-sm px-4 py-1"
                      >
                        {missionProgress?.find(
                          (p: MissionProgress) =>
                            p.mission_id === mission.id &&
                            p.completion_percentage === 100
                        )
                          ? "Complete"
                          : "Not Complete"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Companion: {mission.companion}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export { missions };
