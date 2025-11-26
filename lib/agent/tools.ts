export const toolDefs = [
  {
    type: "function",
    function: {
      name: "writeFile",
      description: "Write or update a file in the GitHub repository",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Relative file path inside the project",
          },
          content: {
            type: "string",
            description: "New file content to write",
          },
        },
        required: ["path", "content"],
      },
    },
  },
];

