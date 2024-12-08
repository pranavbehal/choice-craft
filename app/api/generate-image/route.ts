import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const prediction = await replicate.predictions.create({
      version:
        "bf53bdb93d739c9c915091cfa5f49ca662d11273a5eb30e7a2ec1939bcf27a00",
      input: {
        prompt: prompt,
        go_fast: true,
        aspect_ratio: "16:9",
        output_format: "jpg",
        output_quality: 80,
        safety_tolerance: 2,
        prompt_upsampling: true,
      },
    });

    // Wait for the prediction to complete
    const result = await replicate.wait(prediction);

    if (
      result.output &&
      Array.isArray(result.output) &&
      result.output.length > 0
    ) {
      const imageUrl = result.output[0];
      console.log("Generated image URL:", imageUrl);
      return Response.json({ imageUrl });
    }

    return Response.json({ error: "No image generated" }, { status: 500 });
  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json(
      {
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
