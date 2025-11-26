export const toolDefs = [
  {
    type: "function" as const,
    function: {
      name: "writeFile",
      description: "Write or update a file in the GitHub repository.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The path in the repository, e.g. 'src/app/page.tsx'"
          },
          content: {
            type: "string",
            description: "The full text content that will become the file."
          }
        },
        required: ["path", "content"]
      }
    }
  }
];

