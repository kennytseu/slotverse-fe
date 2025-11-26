import { NextResponse } from "next/server";
import { tools } from "@/lib/agent/tools";
import OpenAI from "openai";

export async function POST(req: Request) {
  const body = await req.json();
  const prompt = body.prompt;

  if (!prompt) {
    return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const toolDefs = [
    {
      type: "function",
      function: {
        name: "writeFile",
        description: "Write or update a file in the GitHub repository",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" },
          },
          required: ["path", "content"],
        },
      },
    },
  ];

  const response = await client.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "system",
        content:
          "You are an autonomous developer that modifies the codebase using tools. When user requests features, write or edit the correct files.",
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

  // If tool call
  if (message.tool_calls?.length) {
    const toolCall = message.tool_calls[0];
    const args = JSON.parse(toolCall.function.arguments);

    if (toolCall.function.name === "writeFile") {
      const result = await tools.writeFile(args);
      return NextResponse.json({ tool_result: result });
    }
  }

  return NextResponse.json({ reply: message.content });
}

