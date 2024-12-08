import { Navigation } from "@/components/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import Image from "next/image";

const missions = [
  {
    id: 1,
    title: "The Lost City",
    description: "Uncover the secrets of an ancient civilization",
    difficulty: "Medium",
    companion: "Professor Blue",
    progress: 0,
    image: "/mission-images/mission-1.jpg",
  },
  {
    id: 2,
    title: "Space Odyssey",
    description: "Navigate through an asteroid field in your spaceship",
    difficulty: "Hard",
    companion: "Captain Nova",
    progress: 25,
    image: "/mission-images/mission-2.jpg",
  },
  {
    id: 3,
    title: "Enchanted Forest",
    description: "Break the curse hurting magical creatures",
    difficulty: "Easy",
    companion: "Fairy Lumi",
    progress: 75,
    image: "/mission-images/mission-3.jpg",
  },
  {
    id: 4,
    title: "Cyber Heist",
    description: "Infiltrate a high-security digital vault",
    difficulty: "Expert",
    companion: "Sergeant Nexus",
    progress: 50,
    image: "/mission-images/mission-4.jpg",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight mb-12 text-center text-primary">
          Choose Your Adventure
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {missions.map((mission) => (
            <Link
              href={`/missions/${mission.id}`}
              key={mission.id}
              className="transition-transform hover:scale-[1.02] duration-300"
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
                          mission.difficulty === "Easy"
                            ? "secondary"
                            : mission.difficulty === "Medium"
                            ? "default"
                            : mission.difficulty === "Hard"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-sm px-4 py-1"
                      >
                        {mission.difficulty}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        AI: {mission.companion}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Progress
                        value={mission.progress}
                        className="h-2 w-full"
                      />
                      <p className="text-sm text-muted-foreground text-right">
                        {mission.progress}% Complete
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export { missions };
