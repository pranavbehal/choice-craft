"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";

const avatars = [
  "/avatars/avatar-1.png",
  "/avatars/avatar-2.png",
  "/avatars/avatar-3.png",
  "/avatars/avatar-4.png",
];

export default function SettingsPage() {
  const [voiceVolume, setVoiceVolume] = useState(50);
  const [sfxVolume, setSfxVolume] = useState(50);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

  useEffect(() => {
    const savedAvatar = localStorage.getItem("userAvatar");
    if (savedAvatar) {
      setSelectedAvatar(savedAvatar);
    }
  }, []);

  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    localStorage.setItem("userAvatar", avatar);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight text-center mb-8 text-primary">
          Settings
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Audio Settings</CardTitle>
              <CardDescription>Adjust game audio levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="voice-volume">Voice Volume</Label>
                <Slider
                  id="voice-volume"
                  min={0}
                  max={100}
                  step={1}
                  value={[voiceVolume]}
                  onValueChange={(value) => setVoiceVolume(value[0])}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground text-right">
                  {voiceVolume}%
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sfx-volume">Sound Effects Volume</Label>
                <Slider
                  id="sfx-volume"
                  min={0}
                  max={100}
                  step={1}
                  value={[sfxVolume]}
                  onValueChange={(value) => setSfxVolume(value[0])}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground text-right">
                  {sfxVolume}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Customization</CardTitle>
              <CardDescription>Choose your avatar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {avatars.map((avatar, index) => (
                  <div
                    key={index}
                    className={`relative cursor-pointer rounded-lg p-2 transition-all hover:bg-accent ${
                      selectedAvatar === avatar
                        ? "ring-2 ring-primary bg-accent"
                        : ""
                    }`}
                    onClick={() => handleAvatarSelect(avatar)}
                  >
                    <Image
                      src={avatar}
                      alt={`Avatar ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
