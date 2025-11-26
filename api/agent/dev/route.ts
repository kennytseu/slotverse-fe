import { NextResponse } from "next/server";
import { toolDefs } from "@/lib/agent/tools";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const body = await req.json();
  const prompt = body.prompt;

  if (!prompt) {
    return NextResponse.json(
      { error: "No prompt provided" },
      { status: 400 }
    );
  }

  // Ask OpenAI (GPT-4.1 or GPT-4.1-mini recommended for agents)
  const response = await client.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "system",
        content:
          "You are an autonomous developer that modifies the codebase using defined tools.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    tools: toolDefs,
    tool_choice: "auto",
  });

  const message = response.choices[0].message;

  // ============================
  // TOOL CALL HANDLING
  // ============================

  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];

    // Narrow the type — only handle actual function-type tools
    if (
      toolCall.type === "function" &&
      toolCall.function
    ) {
      const { name, arguments: argString } = toolCall.function;

      let args: any = {};
      try {
        args = JSON.parse(argString || "{}");
      } catch (e) {
        console.error("JSON parse error in AI tool args:", e);
      }

      // --- handle writeFile
      if (name === "writeFile") {
        const mod = await import("@/lib/agent/git");
        const result = await mod.writeFile(args);
        return NextResponse.json({ tool_result: result });
      }

      return NextResponse.json({
        error: `Unknown tool: ${name}`,
      });
    }

    // If tool_call is not a function type
    return NextResponse.json({
      error: "Tool call received but no valid function definition",
      toolCall,
    });
  }

  // No tool call — return normal AI response
  return NextResponse.json({
    reply: message.content,
  });
}

