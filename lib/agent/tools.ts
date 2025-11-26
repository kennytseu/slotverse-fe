import { commitToGithub } from "./git";

export async function writeFileTool({
  path,
  content,
}: {
  path: string;
  content: string;
}) {
  const repo = process.env.GITHUB_REPO!;
  const branch = process.env.GITHUB_BRANCH!;

  return await commitToGithub({
    repo,
    branch,
    filePath: path,
    content,
    message: `AI Agent: Updated ${path}`,
  });
}

export const tools = {
  writeFile: writeFileTool,
};

