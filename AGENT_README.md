# SlotVerse AI Developer Agent

An autonomous AI developer that can edit files, commit to GitHub, and deploy automatically.

## 🚀 Features

### Core Capabilities
- **GitHub Integration**: Direct file writing and committing via Octokit
- **AI-Powered Development**: Uses OpenAI GPT-4o for intelligent code generation
- **Memory System**: Persistent storage using Upstash Redis for context and history
- **Safety System**: Comprehensive protection against dangerous operations
- **Multi-Interface Access**: Web UI, Telegram bot, and API endpoints

### Available Tools
- `writeFile` - Write or update files in the repository
- `readFile` - Read file contents from GitHub
- `createPage` - Generate new Next.js pages with proper routing
- `createComponent` - Create React components with TypeScript
- `saveMemory` / `getMemory` - Persistent memory operations
- `listFiles` - Browse repository structure

## 🛡️ Safety Features

### Protected Files
The agent cannot modify critical system files:
- `package.json`, `package-lock.json`
- `next.config.ts`, `tsconfig.json`
- Environment files (`.env*`)
- Git configuration (`.gitignore`)
- Deployment configs (`vercel.json`)

### Content Safety
- Blocks dangerous code patterns (eval, exec, shell commands)
- Prevents hardcoded secrets and credentials
- Limits file size (50KB max)
- Rate limiting (10 requests/minute per session)

### API Protection
Sensitive endpoints are protected:
- `/api/auth/*`
- `/api/admin/*`
- `/api/webhook/*`
- `/api/payment/*`

## 🌐 Access Methods

### 1. Web Interface
Visit the homepage for a modern chat interface:
- Real-time conversation with the AI
- Visual feedback on tool executions
- Quick action buttons for common tasks

### 2. Telegram Bot
Use these commands:
- `/start` - Get started and see available commands
- `/build [description]` - Create new features
- `/fix [description]` - Fix bugs or issues
- `/status` - Check system status
- `/help` - Show help message

### 3. API Endpoint
Direct API access at `/api/agent/dev`:
```json
{
  "prompt": "Create a user dashboard component",
  "sessionId": "optional-session-id"
}
```

## 🔧 Environment Variables

Required for full functionality:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# GitHub Integration
GITHUB_TOKEN=your_github_token
GITHUB_REPO=username/repository-name
GITHUB_BRANCH=main

# Upstash Redis (Memory)
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_redis_token

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ALLOWED_TELEGRAM_USER_ID=your_telegram_user_id
```

## 📁 Project Structure

```
lib/agent/
├── git.ts              # GitHub integration and file operations
├── tools.ts            # OpenAI tool definitions
├── tool-functions.ts   # Tool implementation handlers
├── memory.ts           # Redis memory operations
└── safety.ts           # Safety checks and validation

api/
├── agent/dev/route.ts  # Main AI agent endpoint
└── telegram/webhook.ts # Telegram bot webhook

components/
└── AgentInterface.tsx  # Web UI component
```

## 🎯 Example Usage

### Creating a New Component
```
"Create a UserCard component that displays user avatar, name, and email"
```

### Building a Feature
```
"Build a contact form with name, email, message fields and validation"
```

### Fixing Issues
```
"Fix the responsive design on mobile for the navigation menu"
```

### API Development
```
"Create an API endpoint for user registration with email validation"
```

## 🔄 Workflow

1. **User Input** → Web UI, Telegram, or API
2. **Safety Check** → Validate prompt and rate limits
3. **AI Processing** → GPT-4o analyzes and plans
4. **Tool Execution** → File operations with safety checks
5. **GitHub Commit** → Automatic commit with descriptive message
6. **Vercel Deploy** → Automatic deployment via GitHub integration
7. **User Feedback** → Results and status updates

## 🚨 Safety Guidelines

### What the Agent CAN Do
- Create and modify React components
- Build new pages and API routes
- Update styling and layouts
- Add new features and functionality
- Fix bugs and improve code

### What the Agent CANNOT Do
- Modify system configuration files
- Access or modify environment variables
- Delete files or directories
- Execute shell commands
- Modify deployment settings

## 🔮 Future Enhancements

- **Multi-step Planning**: Break complex tasks into subtasks
- **Code Review**: Automated code quality checks
- **Testing Integration**: Generate and run tests
- **Performance Monitoring**: Track and optimize performance
- **Collaboration**: Multi-user sessions and permissions
- **Plugin System**: Extensible tool architecture

## 🤝 Contributing

The agent is designed to be self-improving. It can:
- Enhance its own capabilities
- Add new tools and features
- Improve safety measures
- Optimize performance

Simply ask it to improve itself!

---

**Built with Next.js 16, OpenAI GPT-4o, and deployed on Vercel** 🚀
