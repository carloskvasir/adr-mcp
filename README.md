# ADR MCP Server

A Model Context Protocol (MCP) server for managing Architecture Decision Records (ADRs). This server allows AI coding assistants (like Claude Desktop, Cursor, Antigravity, and Cline) to natively interact with your project's ADRs without relying on fragile bash commands.

## 🚀 Features

### 🛠️ Tools
- `list_adrs`: Instantly returns a list of all ADRs in the current workspace.
- `create_adr`: Creates a correctly formatted ADR. It automatically handles numbering, safe file naming, and markdown generation given a `title`, `context`, `decision`, and `consequences`.

### 📚 Resources
- Exposes all ADR files as native resources using the `adr:///` URI scheme (e.g., `adr:///0001-use-mysql.md`).
- Allows AI agents to read the architectural context instantly, feeding it directly into the prompt without manual `cat` commands.

## 📦 Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/carloskvasir/adr-mcp.git
   cd adr-mcp
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make the script executable:
   ```bash
   chmod +x index.js
   ```

## ⚙️ Configuration

To use this MCP server with your AI agent, add it to the agent's MCP configuration file.

### Claude Desktop
Edit your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "adr-manager": {
      "command": "node",
      "args": [
        "/absolute/path/to/adr-mcp/index.js",
        "/absolute/path/to/your/target/project" 
      ]
    }
  }
}
```

### Cursor / Cline / RooCode
Add it to your `cline_mcp_settings.json` or configure it via the extension settings:
```json
{
  "mcpServers": {
    "adr-manager": {
      "command": "node",
      "args": [
        "/absolute/path/to/adr-mcp/index.js",
        "/absolute/path/to/your/target/project"
      ]
    }
  }
}
```

> **Note:** The second argument in `args` is the target workspace where your `doc/adr` folder lives. If you omit it, the server will default to the current working directory from where the process was launched.

## 💡 Why use an MCP for ADRs?
Normally, AI agents manage ADRs by guessing CLI syntax (`adr new "Title"`) inside a terminal, which fails if the tool isn't installed or if the OS doesn't support bash. By using an MCP server, the AI uses structured JSON-RPC API calls that guarantee **100% precision** and require **zero local dependencies** for the end developer.
