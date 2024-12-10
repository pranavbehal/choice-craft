/**
 * Mission Page Component
 *
 * Dynamic interactive story interface for individual missions.
 * Features real-time AI dialogue, voice synthesis, and progress tracking.
 *
 * @component
 * @requires Authentication
 * @requires OpenAI API
 * @requires ElevenLabs API
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Send } from "lucide-react";
import Image from "next/image";
import { missions } from "@/app/data/missions";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useChat } from "ai/react";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { QuestionButton } from "@/components/help/question-button";

/**
 * Maps companion names to their avatar images
 * @param {string} companionName - Name of the companion character
 * @returns {string} Path to companion's avatar image
 */
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
  // State Management Section
  /** Navigation and routing parameters */
  const params = useParams();
  const router = useRouter();

  /** Character and mission state */
  const [userAvatar, setUserAvatar] = useState("/avatars/avatar-1.png");
  const [currentMission, setCurrentMission] = useState(missions[0]);
  const [aiAvatar, setAiAvatar] = useState(
    getCompanionAvatar(missions[0].companion)
  );

  /** Progress tracking state */
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<
    "same" | "increase" | "decrease"
  >("same");

  /** Dialogue and interaction state */
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [systemMessage, setSystemMessage] = useState("");
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [isStopping, setIsStopping] = useState(false);

  /** Audio and visual state */
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  /** Database integration */
  const { settings, updateMissionProgress } = useDatabase();

  /**
   * Initialize system message for AI character interaction
   * Updates when mission changes to maintain character consistency
   */
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

  /** Chat integration setup with OpenAI */
  const { messages, input, handleInputChange, append } = useChat({
    api: "/api/chat",
    initialMessages: [],
    body: {
      systemMessage,
      currentProgress: progress,
    },
    onFinish: () => {
      setIsTyping(false);
      // console.log(messages);
    },
  });

  /**
   * Processes user input and handles commands
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Syntactic validation - checks for empty/whitespace, if the AI is typing, or if the user has triggered the stop command
    if (!input.trim() || isTyping || isStopping) return;

    const userInput = input.trim().toLowerCase();

    // Semantic validation - checks message length
    if (userInput.length > 500) {
      toast.error("Your message is too long (maximum 500 characters)");
      return;
    }

    // Check for stop command
    if (userInput === "stop") {
      setIsStopping(true);
      toast.info(
        "You have stopped interacting with the story. You will be redirected to the home page in 5 seconds"
      );

      // Disable further interactions
      handleInputChange({
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>);

      // Redirect after 5 seconds
      setTimeout(() => {
        router.push("/");
      }, 5000);

      return;
    }

    // Regular message handling
    if (messages.length === 0) {
      setShowTitle(false);
    }

    const userMessage = `Me: ${userInput}`;
    setShowUserMessage(true);
    setCurrentText(userMessage);

    handleInputChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);

    setTimeout(async () => {
      setIsTyping(true);
      await append({
        content: userMessage,
        role: "user",
      });
      setShowUserMessage(false);
    }, 500);
  };

  /**
   * Processes and displays AI responses with typewriter effect
   * Handles background image generation and audio synthesis
   */
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && !showUserMessage) {
      setIsTyping(true);
      setCurrentText(""); // Clear text immediately

      const processMessage = async () => {
        try {
          const responseData = JSON.parse(lastMessage.content);
          const text = responseData.userResponse;

          // Handle image generation first
          if (responseData.imagePrompt) {
            try {
              const imageResponse = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: responseData.imagePrompt }),
              });

              const imageData = await imageResponse.json();
              if (imageData.imageUrl) {
                setBackgroundImage(imageData.imageUrl);
              }
            } catch (error) {
              console.error("Error generating image:", error);
            }
          }

          // Extract character name and speech text
          const [characterName, speechText] = text.split(": ");

          // Wait for audio to start playing before starting text animation
          try {
            await playTextToSpeech(speechText, characterName);

            // Start typewriter effect
            let index = 0;
            const typewriterInterval = setInterval(() => {
              if (index <= text.length) {
                setCurrentText(text.slice(0, index));
                index++;
              } else {
                clearInterval(typewriterInterval);
                setIsTyping(false);
              }
            }, 30); // Adjust timing to match speech rate

            // Cleanup interval on unmount
            return () => {
              clearInterval(typewriterInterval);
            };
          } catch (error) {
            console.error("Error with audio playback:", error);
            // Fallback to instant text display if audio fails
            setCurrentText(text);
            setIsTyping(false);
          }
        } catch (error) {
          console.error("Error processing message:", error);
          setIsTyping(false);
        }
      };

      processMessage();
    }
  }, [messages, currentMission.companion, showUserMessage]);

  /**
   * Handles text-to-speech conversion and playback
   * @param {string} text - Text to convert to speech
   * @param {string} character - Character voice to use
   */
  const playTextToSpeech = async (text: string, character: string) => {
    // Skip if voice is disabled
    if (!settings?.voice_on) return;

    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, character }),
      });

      if (!response.ok) throw new Error("Failed to generate speech");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;

        return new Promise<void>((resolve, reject) => {
          if (audioRef.current) {
            audioRef.current.onerror = reject;
            audioRef.current.onplay = () => {
              setIsPlaying(true);
              resolve();
            };
            audioRef.current.onended = () => {
              URL.revokeObjectURL(audioUrl);
              setIsPlaying(false);
            };
            audioRef.current.play().catch(reject);
          }
        });
      }
    } catch (error) {
      console.error("Error playing text to speech:", error);
      throw error;
    }
  };

  // Add this to see all messages
  useEffect(() => {
    // console.log("Current messages:", messages);
  }, [messages]);

  // Handle mission finding
  useEffect(() => {
    const missionId = params.id?.toString() || "1";
    const foundMission =
      missions.find((m) => m.id === missionId) || missions[0];
    setCurrentMission(foundMission);
    setAiAvatar(getCompanionAvatar(foundMission.companion));
  }, [params.id]);

  // Update useEffect for avatar
  useEffect(() => {
    if (settings?.profile_picture) {
      const avatarIndex = settings.profile_picture - 1;
      const avatarPath = `/avatars/avatar-${avatarIndex + 1}.png`;
      setUserAvatar(avatarPath);
    }
  }, [settings]);

  // Debug messages
  useEffect(() => {
    if (messages.length > 0) {
      // console.log("Messages updated:", messages);
      // console.log("Last message:", messages[messages.length - 1]);
    }
  }, [messages]);

  /**
   * Updates mission progress and handles completion
   * @param {number} newProgress - Updated progress value
   */
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

  // Update getDisplayMessage to handle the typewriter effect
  const getDisplayMessage = () => {
    if (showUserMessage) return currentText;
    if (isTyping && !currentText) return "Loading...";
    if (!lastMessage) return "Begin your adventure by saying hello...";

    try {
      if (lastMessage.role === "user") {
        return lastMessage.content;
      } else {
        return currentText || "Loading...";
      }
    } catch (error) {
      console.error("Error parsing message:", error);
      return lastMessage.content;
    }
  };

  // Remove the input clear effect since we're doing it immediately in handleSubmit
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
      // Just update character states immediately
      setShowUserMessage(true);
    }
  }, [messages]);

  // Update background when it changes
  useEffect(() => {
    if (backgroundImage) {
      const mainDiv = document.querySelector<HTMLDivElement>(".min-h-screen");
      if (mainDiv) {
        // Create/update a background div for smooth transitions
        let bgDiv = mainDiv.querySelector<HTMLDivElement>(".bg-transition");
        if (!bgDiv) {
          bgDiv = document.createElement("div");
          bgDiv.className = "bg-transition absolute inset-0 -z-10";
          mainDiv.insertBefore(bgDiv, mainDiv.firstChild);
        }

        // Preload the image
        const img = document.createElement("img");
        img.onload = () => {
          // Set up the new background with fade
          bgDiv.style.backgroundImage = `url(${backgroundImage})`;
          bgDiv.style.backgroundSize = "cover";
          bgDiv.style.backgroundPosition = "center";
          bgDiv.style.backgroundAttachment = "fixed";
          bgDiv.style.opacity = "0";
          bgDiv.style.transition = "opacity 0.3s ease-in-out";

          // Trigger the fade in
          requestAnimationFrame(() => {
            bgDiv.style.opacity = "1";
          });
        };
        img.src = backgroundImage;
      }
    }
  }, [backgroundImage]);

  const markMissionComplete = async () => {
    try {
      await updateMissionProgress({
        mission_id: currentMission.id,
        completion_percentage: 100,
        // Add other stats you want to track
        decisions_made: messages.length,
        time_spent: "3600", // You might want to track actual time
        achievements: JSON.stringify(["Mission Complete"]),
      });
    } catch (error) {
      console.error("Error marking mission complete:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <audio
        ref={audioRef}
        className="hidden"
        // Uncomment for debugging
        // controls
      />

      {/* Background div with improved transitions */}
      <div
        className="absolute inset-0 -z-10 transition-all duration-1000"
        style={{
          backgroundImage: `url(${currentMission?.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          opacity: backgroundImage ? 0 : 1,
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="relative">
          <Navigation />
          <div className="w-full py-2">
            {/* <div className="max-w-md mx-auto px-4">
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
            </div> */}
          </div>
        </div>

        {/* Character Images with improved transitions */}
        <div className="absolute -top-40 w-full flex justify-between items-end z-10">
          <div className="flex flex-col items-center ml-6">
            <Image
              src={aiAvatar}
              alt="AI companion"
              width={160}
              height={160}
              className={`transition-all duration-500 ${getCharacterOpacity(
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

        {/* Mission Title with fade out animation */}
        <div
          className="absolute w-full transition-opacity duration-1000"
          style={{
            top: `calc(50% - var(--nav-height))`,
            transform: "translateY(-50%)",
            opacity: showTitle ? 1 : 0,
            pointerEvents: showTitle ? "auto" : "none",
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
                      className={`transition-all duration-500 ${getCharacterOpacity(
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
                    {isTyping && !currentText ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      getDisplayMessage()
                        .split(": ")
                        .map((part: string, index: number) =>
                          index === 0 ? <span key={index}>{part}: </span> : part
                        )
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
      <div className="relative z-[100]">
        <QuestionButton />
      </div>
      {isStopping && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 pointer-events-none" />
      )}
    </div>
  );
}
