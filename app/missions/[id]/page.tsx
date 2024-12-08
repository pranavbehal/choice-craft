"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Send } from "lucide-react";
import Image from "next/image";
import { missions } from "@/app/page";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useChat } from "ai/react";

const getCompanionAvatar = (companionName: string) => {
  const nameToFile: { [key: string]: string } = {
    "Professor Blue": "/companions/professor-blue.png",
    "Captain Nova": "/companions/captain-nova.png",
    "Fairy Lumi": "/companions/fairy-lumi.png",
    "Sergeant Nexus": "/companions/sergeant-nexus.png",
  };
  return nameToFile[companionName] || "/companions/professor-blue.png";
};

export default function MissionPage() {
  const params = useParams();
  const [userAvatar, setUserAvatar] = useState("/avatars/avatar-1.png");
  const [currentMission, setCurrentMission] = useState(missions[0]);
  const [aiAvatar, setAiAvatar] = useState(
    getCompanionAvatar(missions[0].companion)
  );
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<
    "same" | "increase" | "decrease"
  >("same");
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [systemMessage, setSystemMessage] = useState("");
  const [showUserMessage, setShowUserMessage] = useState(false);

  // Set up system message when mission changes
  useEffect(() => {
    setSystemMessage(`You are ${currentMission.companion}, a character in an interactive story.
    Current mission: ${currentMission.title} - ${currentMission.description}. Don't be very wordy, you must be concise, use normal words, and act like a real person.
    
    Character Guidelines:
    - Professor Blue: Speak like an enthusiastic, knowledgeable archaeologist
    - Captain Nova: Use space terminology and be confident
    - Fairy Lumi: Be gentle and mystical in your responses
    - Sergeant Nexus: Be direct and use cybersecurity terms
    
    Keep responses concise (1-3 sentences) and stay in character.
    Guide the user through the mission while maintaining the story's atmosphere.`);
  }, [currentMission]);

  const { messages, input, handleInputChange, append } = useChat({
    api: "/api/chat",
    initialMessages: [],
    body: {
      systemMessage,
    },
    onFinish: () => {
      setIsTyping(false);
      updateProgress(Math.min(progress + 10, 100));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userInput = input;
    handleInputChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);

    const userMessage = `Me: ${userInput}`;
    setShowUserMessage(true);
    setCurrentText(userMessage);

    setTimeout(async () => {
      setIsTyping(true);
      await append({
        content: userMessage,
        role: "user",
      });
      setShowUserMessage(false);
    }, 500);
  };

  // Add this to see all messages
  useEffect(() => {
    console.log("Current messages:", messages);
  }, [messages]);

  // Handle mission finding
  useEffect(() => {
    const missionId = typeof params.id === "string" ? parseInt(params.id) : 1;
    const foundMission =
      missions.find((m) => m.id === missionId) || missions[0];
    setCurrentMission(foundMission);
    setAiAvatar(getCompanionAvatar(foundMission.companion));
  }, [params.id]);

  // Handle localStorage
  useEffect(() => {
    const savedAvatar = localStorage.getItem("userAvatar");
    if (savedAvatar) {
      setUserAvatar(savedAvatar);
    }
  }, []);

  // Type out the latest message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && !showUserMessage) {
      setIsTyping(true);
      let index = 0;
      const baseText = lastMessage.content.replace(
        `${currentMission.companion}: `,
        ""
      );
      const formattedText = `${currentMission.companion}: ${baseText}`;

      const interval = setInterval(() => {
        setCurrentText(formattedText.slice(0, index));
        index++;
        if (index > formattedText.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 25);

      return () => clearInterval(interval);
    }
  }, [messages, currentMission.companion, showUserMessage]);

  // Debug messages
  useEffect(() => {
    if (messages.length > 0) {
      console.log("Messages updated:", messages);
      console.log("Last message:", messages[messages.length - 1]);
    }
  }, [messages]);

  const updateProgress = (newProgress: number) => {
    if (newProgress > progress) {
      setProgressStatus("increase");
    } else if (newProgress < progress) {
      setProgressStatus("decrease");
    } else {
      setProgressStatus("same");
    }
    setProgress(newProgress);
    setTimeout(() => setProgressStatus("same"), 1000);
  };

  const lastMessage = messages[messages.length - 1];

  // Update the character image opacity based on message role
  const getCharacterOpacity = (role: string) => {
    if (!lastMessage) return "opacity-40 scale-75";
    if (role === "assistant" && lastMessage.role === "assistant")
      return "opacity-100 scale-100";
    if (role === "user" && lastMessage.role === "user")
      return "opacity-100 scale-100";
    return "opacity-40 scale-75";
  };

  const getDisplayMessage = () => {
    if (showUserMessage || isTyping) return currentText;
    if (!lastMessage) return "Begin your adventure...";

    if (lastMessage.role === "user") {
      return lastMessage.content;
    } else {
      const baseText = lastMessage.content.replace(
        `${currentMission.companion}: `,
        ""
      );
      return `${currentMission.companion}: ${baseText}`;
    }
  };

  // Remove the input clear effect since we're doing it immediately in handleSubmit
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
      // Just update character states immediately
      setShowUserMessage(true);
    }
  }, [messages]);

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${currentMission?.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        opacity: 1,
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="relative">
          <Navigation />
          <div className="w-full py-2">
            <div className="max-w-md mx-auto px-4">
              <Progress
                value={progress}
                className="h-2"
                indicatorClassName={cn(
                  "transition-all duration-1000",
                  progressStatus === "increase" && "bg-green-500",
                  progressStatus === "decrease" && "bg-red-500",
                  progressStatus === "same" && "animate-shake"
                )}
              />
              <p className="text-center text-sm mt-1 text-muted-foreground">
                Mission Progress: {progress}%
              </p>
            </div>
          </div>
        </div>

        {/* Mission Title - Adjusted for nav height */}
        <div
          className="absolute w-full"
          style={{
            top: `calc(50% - var(--nav-height))`,
            transform: "translateY(-50%)",
          }}
        >
          <h1 className="text-5xl font-bold text-white text-center tracking-tight drop-shadow-lg">
            {currentMission?.title}
          </h1>
        </div>

        <main className="flex-grow flex flex-col">
          {/* Dialogue Section */}
          <div className="flex-grow flex flex-col p-4 relative">
            <div className="absolute bottom-32 left-0 right-0 px-4">
              <div className="relative max-w-2xl mx-auto">
                {/* Character Images */}
                <div className="absolute -top-40 w-full flex justify-between items-end z-10">
                  <div className="flex flex-col items-center ml-6">
                    <Image
                      src={aiAvatar}
                      alt="AI companion"
                      width={160}
                      height={160}
                      className={`transition-all duration-300 ${getCharacterOpacity(
                        "assistant"
                      )}`}
                    />
                  </div>
                  <div className="flex flex-col items-center mr-6">
                    <Image
                      src={userAvatar}
                      alt="User avatar"
                      width={160}
                      height={160}
                      className={`transition-all duration-300 ${getCharacterOpacity(
                        "user"
                      )}`}
                    />
                  </div>
                </div>

                {/* Dialogue Box */}
                <div className="bg-[#F6E6C5] border-4 border-[#8B7355] rounded-2xl p-6 shadow-lg">
                  <p className="text-black text-lg min-h-[28px] [&>span]:font-bold">
                    {getDisplayMessage()
                      .split(": ")
                      .map((part, index, array) =>
                        index === 0 ? <span key={index}>{part}: </span> : part
                      )}
                  </p>
                </div>
                <div
                  className="absolute -bottom-4 right-12 w-8 h-8 
                            border-t-4 border-r-4 border-[#8B7355] 
                            transform rotate-45 bg-[#F6E6C5]
                            shadow-md"
                />
              </div>
            </div>

            {/* Input Section */}
            <form
              onSubmit={handleSubmit}
              className="mt-auto flex items-center space-x-3 max-w-2xl mx-auto mb-8"
            >
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="bg-card h-12 text-lg px-4 border-2 focus:border-primary"
              />
              <Button
                type="submit"
                disabled={isTyping || !input.trim()}
                size="lg"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
