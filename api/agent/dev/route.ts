import { NextResponse } from "next/server";
import { toolDefs } from "@/lib/agent/tools";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json(
        { error: "No prompt provided" },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // Call AI with function tools
    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "You are an autonomous developer that modifies the codebase using tools. When the user requests changes, call the correct tool with arguments.",
        },
        { role: "user", content: prompt },
      ],
      tools: toolDefs as any,
      tool_choice: "auto",
    });

    const message = response.choices[0].message;

    // If the model calls a function/tool
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments || "{}");

      // Handle writeFile
      if (toolCall.function.name === "writeFile") {
        const { writeFile } = await import("@/lib/agent/git");

        const result = await writeFile(args);

        return NextResponse.json({
          tool_result: result,
        });
      }
    }

    // AI answered normally
    return NextResponse.json({
      reply: message.content,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Error" },
      { status: 500 }
    );
  }
}

