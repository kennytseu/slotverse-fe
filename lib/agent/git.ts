import { Octokit } from "octokit";

export const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * Low-level commit function
 */
export async function commitToGithub({
  repo,
  branch,
  filePath,
  content,
  message,
}: {
  repo: string;
  branch: string;
  filePath: string;
  content: string;
  message: string;
}) {
  const [owner, repoName] = repo.split("/");

  // Get the latest commit SHA of the branch
  const { data: refData } = await github.rest.git.getRef({
    owner,
    repo: repoName,
    ref: `heads/${branch}`,
  });

  const latestCommitSha = refData.object.sha;

  // Get the commit tree from the latest commit
  const { data: commitData } = await github.rest.git.getCommit({
    owner,
    repo: repoName,
    commit_sha: latestCommitSha,
  });

  // Create new blob
  const { data: blobData } = await github.rest.git.createBlob({
    owner,
    repo: repoName,
    content: Buffer.from(content).toString("base64"),
    encoding: "base64",
  });

  // Create tree
  const { data: newTree } = await github.rest.git.createTree({
    owner,
    repo: repoName,
    base_tree: commitData.tree.sha,
    tree: [
      {
        path: filePath,
        mode: "100644",
        type: "blob",
        sha: blobData.sha,
      },
    ],
  });

  // Create commit
  const { data: newCommit } = await github.rest.git.createCommit({
    owner,
    repo: repoName,
    message,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  // Update branch pointer
  await github.rest.git.updateRef({
    owner,
    repo: repoName,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
    force: true,
  });

  return {
    success: true,
    commit: newCommit.sha,
  };
}

/**
 * High-level function used by the AI agent tool
 * This is what the agent calls when GPT decides to modify a file
 */
export async function writeFile({
  path,
  content,
}: {
  path: string;
  content: string;
}) {
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!repo) {
    throw new Error("Missing env GITHUB_REPO");
  }

  const message = `AI Agent updated file: ${path}`;

  const result = await commitToGithub({
    repo,
    branch,
    filePath: path,
    content,
    message,
  });

  return {
    updated: true,
    commit: result.commit,
    path,
  };
}

