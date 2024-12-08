import { NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const VOICE_IDS = {
  "Professor Blue": "1SM7GgM6IMuvQlz2BwM3",
  "Captain Nova": "DATmubGSst6fXALPucOB",
  "Fairy Lumi": "XfNU2rGpBa01ckF309OY",
  "Sergeant Nexus": "sjwRAsCdMJodJszgJ6Ks",
};

export async function POST(req: Request) {
  try {
    const { text, character } = await req.json();
    const voiceId = VOICE_IDS[character as keyof typeof VOICE_IDS];

    if (!voiceId) {
      return NextResponse.json({ error: "Invalid character" }, { status: 400 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY!,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    // Forward the audio stream with correct headers
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
