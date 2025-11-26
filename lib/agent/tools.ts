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
  },
  {
    type: "function" as const,
    function: {
      name: "readFile",
      description: "Read the contents of a file from the GitHub repository.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The path in the repository, e.g. 'src/app/page.tsx'"
          }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "createPage",
      description: "Create a new Next.js page with proper routing and structure.",
      parameters: {
        type: "object",
        properties: {
          pageName: {
            type: "string",
            description: "The name of the page, e.g. 'dashboard', 'profile'"
          },
          pageType: {
            type: "string",
            enum: ["app-router", "api-route"],
            description: "Type of page to create"
          },
          content: {
            type: "string",
            description: "Optional custom content for the page"
          }
        },
        required: ["pageName", "pageType"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "createComponent",
      description: "Create a new React component with TypeScript.",
      parameters: {
        type: "object",
        properties: {
          componentName: {
            type: "string",
            description: "The name of the component, e.g. 'Button', 'UserCard'"
          },
          componentType: {
            type: "string",
            enum: ["client", "server"],
            description: "Whether it's a client or server component"
          },
          props: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                optional: { type: "boolean" }
              }
            },
            description: "Props interface for the component"
          }
        },
        required: ["componentName", "componentType"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "saveMemory",
      description: "Save information to persistent memory for later use.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "Unique key for the memory entry"
          },
          value: {
            type: "string",
            description: "The information to store"
          }
        },
        required: ["key", "value"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "getMemory",
      description: "Retrieve information from persistent memory.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "The key of the memory entry to retrieve"
          }
        },
        required: ["key"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "listFiles",
      description: "List files in a directory of the repository.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The directory path to list, defaults to root"
          }
        },
        required: []
      }
    }
  }
];

