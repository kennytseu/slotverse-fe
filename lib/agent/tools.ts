export const toolDefs = [
  {
    type: "function",
    function: {
      name: "append_to_file",
      description: "Append content to a file in the repository.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Path to the file to modify"
          },
          content: {
            type: "string",
            description: "Content to append"
          }
        },
        required: ["path", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "overwrite_file",
      description: "Overwrite a file entirely with new content.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" }
        },
        required: ["path", "content"]
      }
    }
  }
];

