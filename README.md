# ADR Manager for AI Assistants

Welcome! This tool gives your favorite AI assistant (like Claude Desktop, Cursor, or RooCode) the superpower to natively manage your project's Architecture Decision Records (ADRs).

Normally, setting up and maintaining ADRs requires installing command-line tools and memorizing syntax. With this MCP (Model Context Protocol) server, you just talk to your AI naturally!

## 🎯 How a Common User Uses This

Once installed, you don't need to touch the terminal or remember file naming conventions. Just open your AI chat and say:

> *"Hey, we decided to use PostgreSQL instead of MySQL because of its JSONB support. Please create an ADR for this."*

**The AI will automatically:**
1. Calculate the correct next number (e.g., `0015-use-postgresql.md`).
2. Format the Markdown file perfectly with the Context, Decision, and Consequences.
3. Save it directly into your project's `doc/adr` folder.

You can also ask things like:
> *"What were our past decisions regarding our caching strategy?"*

The AI will instantly read all your past ADRs as native resources and answer you immediately, with full context.

## 📦 Quick Usage (No Installation Required)

Because this package is distributed via npm, you do not need to clone the repository or manage dependencies manually. It works seamlessly with modern tool managers like `mise`, `asdf`, or standard Node.js.

Just open your AI's configuration file (e.g., `claude_desktop_config.json` for Claude Desktop, or `cline_mcp_settings.json` for VS Code extensions) and add this block:

```json
{
  "mcpServers": {
    "adr-manager": {
      "command": "npx",
      "args": [
        "-y",
        "adr-mcp",
        "/absolute/path/to/your/project/folder"
      ]
    }
  }
}
```
*That's it! Restart your AI client. The `npx` command will automatically download and execute the MCP server in the background.*

### Local Development / Manual Build
If you want to contribute or run it from source:
```bash
git clone https://github.com/carloskvasir/adr-mcp.git
cd adr-mcp
npm install
npm link
```

## 🚀 Advanced Capabilities & Roadmap (Graph Networks)

As a project grows, the relationships between architectural decisions become highly complex (e.g., Decision A *supersedes* Decision B, but *depends on* Decision C). 

Because this tool is built as a robust MCP Server, it can go far beyond simple text files. **In future updates, this MCP can natively orchestrate local Docker containers to run Graph Databases (like RedisGraph or Neo4j) in the background.**

This advanced architecture will allow the AI to:
- Map and query complex dependency graphs of your architectural decisions.
- Perform deep impact analysis (e.g., *"If we deprecate Redis, which other architectural decisions are impacted?"*).
- Execute all of this transparently, without the end-user needing to manually manage databases or containers.

## 📝 License

This project is licensed under the Mozilla Public License 2.0 (MPL-2.0) - see the [LICENSE](LICENSE) file for details.

Copyright (c) Carlos Kvasir <gpg@carloskvasir.dev>
