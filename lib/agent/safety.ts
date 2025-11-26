// Safety system for the AI agent

export interface SafetyCheck {
  allowed: boolean;
  reason?: string;
  suggestion?: string;
}

// Files that should never be modified by the AI
const PROTECTED_FILES = [
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'next.config.js',
  'tsconfig.json',
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.gitignore',
  'vercel.json',
  '.vercelignore',
  'README.md',
  'LICENSE'
];

// Directories that should never be modified
const PROTECTED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.next',
  '.vercel',
  'dist',
  'build',
  'out'
];

// File extensions that are allowed to be modified
const ALLOWED_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.scss',
  '.sass',
  '.md',
  '.json',
  '.txt',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp'
];

// Dangerous patterns in file content
const DANGEROUS_PATTERNS = [
  /process\.env\.[A-Z_]+\s*=/, // Setting environment variables
  /rm\s+-rf/, // Dangerous shell commands
  /eval\s*\(/, // eval() calls
  /exec\s*\(/, // exec() calls
  /child_process/, // Node.js child process
  /fs\.unlink/, // File deletion
  /fs\.rmdir/, // Directory deletion
  /DELETE\s+FROM/, // SQL DELETE statements
  /DROP\s+(TABLE|DATABASE)/, // SQL DROP statements
];

// Sensitive API endpoints that shouldn't be modified
const SENSITIVE_API_PATTERNS = [
  /\/api\/auth/,
  /\/api\/admin/,
  /\/api\/webhook/,
  /\/api\/payment/,
  /\/api\/billing/
];

export function checkFileSafety(filePath: string, content?: string): SafetyCheck {
  // Normalize path
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = normalizedPath.split('/').pop() || '';
  const fileExtension = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';

  // Check if file is protected
  if (PROTECTED_FILES.includes(fileName)) {
    return {
      allowed: false,
      reason: `File "${fileName}" is protected and cannot be modified by the AI agent`,
      suggestion: `If you need to modify this file, please do it manually or ask a human developer`
    };
  }

  // Check if in protected directory
  for (const protectedDir of PROTECTED_DIRECTORIES) {
    if (normalizedPath.includes(protectedDir + '/') || normalizedPath.startsWith(protectedDir)) {
      return {
        allowed: false,
        reason: `Files in "${protectedDir}" directory cannot be modified`,
        suggestion: `This directory is automatically managed and should not be modified manually`
      };
    }
  }

  // Check file extension
  if (fileExtension && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      allowed: false,
      reason: `File extension "${fileExtension}" is not allowed`,
      suggestion: `Only these extensions are allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  // Check for sensitive API endpoints
  if (normalizedPath.includes('/api/')) {
    for (const pattern of SENSITIVE_API_PATTERNS) {
      if (pattern.test(normalizedPath)) {
        return {
          allowed: false,
          reason: `API endpoint "${normalizedPath}" is sensitive and protected`,
          suggestion: `Sensitive API endpoints should be modified manually for security reasons`
        };
      }
    }
  }

  // Check content if provided
  if (content) {
    const contentCheck = checkContentSafety(content);
    if (!contentCheck.allowed) {
      return contentCheck;
    }
  }

  return { allowed: true };
}

export function checkContentSafety(content: string): SafetyCheck {
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      return {
        allowed: false,
        reason: `Content contains potentially dangerous code pattern: ${pattern.source}`,
        suggestion: `Please review this code manually for security implications`
      };
    }
  }

  // Check for hardcoded secrets (basic patterns)
  const secretPatterns = [
    /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/i,
    /secret[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/i,
    /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
    /token\s*[:=]\s*['"][^'"]{20,}['"]/i,
  ];

  for (const pattern of secretPatterns) {
    if (pattern.test(content)) {
      return {
        allowed: false,
        reason: `Content appears to contain hardcoded secrets or credentials`,
        suggestion: `Use environment variables for sensitive data instead`
      };
    }
  }

  // Check for excessively large files (> 50KB)
  if (content.length > 50000) {
    return {
      allowed: false,
      reason: `File content is too large (${Math.round(content.length / 1000)}KB > 50KB)`,
      suggestion: `Large files should be created manually or split into smaller components`
    };
  }

  return { allowed: true };
}

export function checkPromptSafety(prompt: string): SafetyCheck {
  const dangerousPrompts = [
    /delete.*file/i,
    /remove.*file/i,
    /drop.*table/i,
    /delete.*database/i,
    /rm\s+-rf/i,
    /format.*drive/i,
    /shutdown/i,
    /reboot/i,
  ];

  for (const pattern of dangerousPrompts) {
    if (pattern.test(prompt)) {
      return {
        allowed: false,
        reason: `Prompt contains potentially dangerous instructions`,
        suggestion: `Please rephrase your request to focus on creating or modifying code safely`
      };
    }
  }

  return { allowed: true };
}

// Rate limiting for safety
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(sessionId: string, maxRequests = 10, windowMs = 60000): SafetyCheck {
  const now = Date.now();
  const sessionData = rateLimitMap.get(sessionId);

  if (!sessionData || now > sessionData.resetTime) {
    // Reset or initialize
    rateLimitMap.set(sessionId, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (sessionData.count >= maxRequests) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${maxRequests} requests per minute`,
      suggestion: `Please wait before making more requests`
    };
  }

  sessionData.count++;
  return { allowed: true };
}

// Comprehensive safety check function
export function performSafetyCheck(
  filePath: string,
  content: string,
  prompt: string,
  sessionId: string
): SafetyCheck {
  // Check rate limit first
  const rateLimitCheck = checkRateLimit(sessionId);
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck;
  }

  // Check prompt safety
  const promptCheck = checkPromptSafety(prompt);
  if (!promptCheck.allowed) {
    return promptCheck;
  }

  // Check file safety
  const fileCheck = checkFileSafety(filePath, content);
  if (!fileCheck.allowed) {
    return fileCheck;
  }

  return { allowed: true };
}
