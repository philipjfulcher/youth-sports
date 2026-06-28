# Netlify MCP Server Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Netlify MCP server to Claude Code so Netlify tools (sites, deploys, env vars, Netlify DB) are available in this session.

**Architecture:** The Netlify MCP server runs as a local process launched by Claude Code via `npx`. Claude Code's user-level settings file (`~/.claude/settings.json`) registers it under `mcpServers`. A Netlify personal access token is required and passed as an environment variable.

**Tech Stack:** `@netlify/mcp-server` (npm), Claude Code settings.json

## Global Constraints

- Settings file: `~/.claude/settings.json` (user-level, not project-level)
- MCP server package: `@netlify/mcp-server`
- Token env var name: `NETLIFY_TOKEN`
- Do NOT commit the token to git

---

## File Map

| File | Change |
|---|---|
| `~/.claude/settings.json` | Add `mcpServers.netlify` entry |

---

## Task 1: Register Netlify MCP Server in Claude Code Settings

**Files:**
- Modify: `~/.claude/settings.json`

**Interfaces:**
- Produces: Netlify MCP tools available in Claude Code sessions for this user

- [ ] **Step 1: Get a Netlify personal access token**

Go to https://app.netlify.com/user/applications → "Personal access tokens" → "New access token". Name it "Claude Code MCP". Copy the token value — you will only see it once.

- [ ] **Step 2: Read the current settings file**

```bash
cat ~/.claude/settings.json
```

- [ ] **Step 3: Add the Netlify MCP server entry**

Merge the following into the `~/.claude/settings.json` JSON object (preserve all existing keys):

```json
{
  "mcpServers": {
    "netlify": {
      "command": "npx",
      "args": ["-y", "@netlify/mcp-server"],
      "env": {
        "NETLIFY_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Replace `YOUR_TOKEN_HERE` with the actual token from Step 1.

- [ ] **Step 4: Verify the MCP server starts**

Start a new Claude Code session (the MCP server is loaded at session start). Run:

```
/mcp
```

Expected: `netlify` listed as a connected server with its tools visible.

- [ ] **Step 5: Smoke-test a Netlify tool**

Ask Claude Code: "List my Netlify sites using the MCP tools."

Expected: Your sites are listed without error.
