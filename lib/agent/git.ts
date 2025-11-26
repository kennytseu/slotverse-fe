import { Octokit } from "octokit";

export const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

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

  // Get latest commit SHA
  const { data: refData } = await github.rest.git.getRef({
    owner,
    repo: repoName,
    ref: `heads/${branch}`,
  });

  const latestCommitSha = refData.object.sha;

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

  // Create new tree
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

  // Create new commit
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

