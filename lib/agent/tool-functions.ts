import { writeFile } from "./git";
import { saveMemory, getMemory } from "./memory";
import { github } from "./git";
import { checkFileSafety, performSafetyCheck } from "./safety";

export async function handleReadFile({ path }: { path: string }) {
  const repo = process.env.GITHUB_REPO;
  if (!repo) {
    throw new Error("Missing env GITHUB_REPO");
  }

  const [owner, repoName] = repo.split("/");

  try {
    const { data } = await github.rest.repos.getContent({
      owner,
      repo: repoName,
      path,
    });

    if ('content' in data && data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return {
        success: true,
        path,
        content,
        size: data.size
      };
    }

    return {
      success: false,
      error: "File not found or is a directory"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function handleWriteFile({ path, content }: { path: string; content: string }) {
  // Safety check
  const safetyCheck = checkFileSafety(path, content);
  if (!safetyCheck.allowed) {
    return {
      success: false,
      error: safetyCheck.reason,
      suggestion: safetyCheck.suggestion
    };
  }

  return await writeFile({ path, content });
}

export async function handleCreatePage({ 
  pageName, 
  pageType, 
  content 
}: { 
  pageName: string; 
  pageType: "app-router" | "api-route"; 
  content?: string 
}) {
  let filePath: string;
  let defaultContent: string;

  if (pageType === "app-router") {
    filePath = `app/${pageName}/page.tsx`;
    defaultContent = content || `export default function ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">${pageName.charAt(0).toUpperCase() + pageName.slice(1)}</h1>
      <p>Welcome to the ${pageName} page!</p>
    </div>
  );
}`;
  } else {
    filePath = `app/api/${pageName}/route.ts`;
    defaultContent = content || `import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Hello from ${pageName} API" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}`;
  }

  return await handleWriteFile({ path: filePath, content: defaultContent });
}

export async function handleCreateComponent({ 
  componentName, 
  componentType, 
  props = [] 
}: { 
  componentName: string; 
  componentType: "client" | "server"; 
  props?: Array<{ name: string; type: string; optional?: boolean }> 
}) {
  const filePath = `components/${componentName}.tsx`;
  
  // Generate props interface
  const propsInterface = props.length > 0 ? `
interface ${componentName}Props {
${props.map(prop => `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`).join('\n')}
}` : '';

  const propsParam = props.length > 0 ? `{ ${props.map(p => p.name).join(', ')} }: ${componentName}Props` : '';
  const clientDirective = componentType === "client" ? `"use client";\n\n` : '';

  const content = `${clientDirective}${propsInterface}

export default function ${componentName}(${propsParam}) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">${componentName}</h2>
      {/* Add your component content here */}
    </div>
  );
}`;

  return await handleWriteFile({ path: filePath, content });
}

export async function handleSaveMemory({ key, value }: { key: string; value: string }) {
  try {
    await saveMemory(key, value);
    return {
      success: true,
      key,
      message: "Memory saved successfully"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function handleGetMemory({ key }: { key: string }) {
  try {
    const value = await getMemory(key);
    return {
      success: true,
      key,
      value
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function handleListFiles({ path = "" }: { path?: string }) {
  const repo = process.env.GITHUB_REPO;
  if (!repo) {
    throw new Error("Missing env GITHUB_REPO");
  }

  const [owner, repoName] = repo.split("/");

  try {
    const { data } = await github.rest.repos.getContent({
      owner,
      repo: repoName,
      path,
    });

    if (Array.isArray(data)) {
      return {
        success: true,
        path,
        files: data.map(item => ({
          name: item.name,
          type: item.type,
          size: item.size,
          path: item.path
        }))
      };
    }

    return {
      success: false,
      error: "Path is not a directory"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
