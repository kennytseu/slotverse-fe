import { NextResponse } from "next/server";
import { toolDefs } from "@/lib/agent/tools";
import { saveAgentHistory } from "@/lib/agent/memory";
import { checkPromptSafety, checkRateLimit } from "@/lib/agent/safety";
import {
  handleReadFile,
  handleWriteFile,
  handleCreatePage,
  handleCreateComponent,
  handleSaveMemory,
  handleGetMemory,
  handleListFiles
} from "@/lib/agent/tool-functions";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const body = await req.json();
  const prompt = body.prompt;
  const sessionId = body.sessionId || 'default';

  if (!prompt) {
    return NextResponse.json(
      { error: "No prompt provided" },
      { status: 400 }
    );
  }

  // Safety checks
  const rateLimitCheck = checkRateLimit(sessionId);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { 
        error: rateLimitCheck.reason,
        suggestion: rateLimitCheck.suggestion 
      },
      { status: 429 }
    );
  }

  const promptSafetyCheck = checkPromptSafety(prompt);
  if (!promptSafetyCheck.allowed) {
    return NextResponse.json(
      { 
        error: promptSafetyCheck.reason,
        suggestion: promptSafetyCheck.suggestion 
      },
      { status: 400 }
    );
  }

  // Save the user prompt to history
  await saveAgentHistory(sessionId, {
    type: 'user_prompt',
    content: prompt
  });

  // Ask OpenAI (GPT-4.1 or GPT-4.1-mini recommended for agents)
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an autonomous developer that modifies the codebase using defined tools.
        
IMPORTANT GUIDELINES:
- Always use the safety-checked writeFile tool instead of directly writing to protected files
- When creating new features, break them down into logical components
- Use memory to track multi-step tasks and maintain context
- Provide clear, helpful responses about what you're doing
- If you need to read a file before modifying it, use readFile first
        
Current session: ${sessionId}`,
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
    const results = [];
    
    for (const toolCall of message.tool_calls) {
      if (toolCall.type === "function" && toolCall.function) {
        const { name, arguments: argString } = toolCall.function;

        let args: any = {};
        try {
          args = JSON.parse(argString || "{}");
        } catch (e) {
          console.error("JSON parse error in AI tool args:", e);
          continue;
        }

        let result;
        
        try {
          switch (name) {
            case "writeFile":
              result = await handleWriteFile(args);
              break;
            case "readFile":
              result = await handleReadFile(args);
              break;
            case "createPage":
              result = await handleCreatePage(args);
              break;
            case "createComponent":
              result = await handleCreateComponent(args);
              break;
            case "saveMemory":
              result = await handleSaveMemory(args);
              break;
            case "getMemory":
              result = await handleGetMemory(args);
              break;
            case "listFiles":
              result = await handleListFiles(args);
              break;
            default:
              result = { error: `Unknown tool: ${name}` };
          }
          
          // Save tool execution to history
          await saveAgentHistory(sessionId, {
            type: 'tool_execution',
            tool: name,
            args,
            result
          });
          
          results.push({ tool: name, result });
        } catch (error: any) {
          const errorResult = { error: error.message };
          await saveAgentHistory(sessionId, {
            type: 'tool_error',
            tool: name,
            args,
            error: error.message
          });
          results.push({ tool: name, result: errorResult });
        }
      }
    }

    return NextResponse.json({ 
      tool_results: results,
      ai_response: message.content 
    });
  }

  // No tool call — return normal AI response
  await saveAgentHistory(sessionId, {
    type: 'ai_response',
    content: message.content
  });

  return NextResponse.json({
    reply: message.content,
  });
}

