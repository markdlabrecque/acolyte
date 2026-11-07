// Explicit empty sources suppress both SYSTEM.md and APPEND_SYSTEM.md discovery.
// --no-context-files alone disables only AGENTS.md/CLAUDE.md.
// Key-bearing online sessions never receive a shell or code-execution tool.
export const PI_IMPLEMENT_TOOLS = Object.freeze(['read', 'edit', 'write', 'grep', 'find', 'ls']);
export const PI_REVIEW_TOOLS = Object.freeze(['read', 'grep', 'find', 'ls']);
export const PI_RESOURCE_ARGS = Object.freeze([
  '--no-session', '--no-extensions', '--no-skills', '--no-context-files',
  '--no-prompt-templates', '--no-themes', '--no-approve',
  '--system-prompt', '/dev/null', '--append-system-prompt', '/dev/null',
]);
