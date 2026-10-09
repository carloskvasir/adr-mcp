#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";

// Initialize the MCP Server
const server = new Server(
  {
    name: "adr-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Determine workspace (defaults to current directory if not passed as arg)
const workspace = process.argv[2] || process.cwd();
let ADR_DIR = path.join(workspace, "doc", "adr");

// Basic utility to ensure ADR directory exists
async function ensureAdrDir() {
  try {
    // Check if alternate architecture/decisions folder exists
    const altPath = path.join(workspace, "doc", "architecture", "decisions");
    const stat = await fs.stat(altPath);
    if (stat.isDirectory()) ADR_DIR = altPath;
  } catch (e) {
    // Ignore, keep default
  }
  await fs.mkdir(ADR_DIR, { recursive: true });
}

// -----------------------------------------------------
// 1. RESOURCES: Expose all ADRs as URIs
// -----------------------------------------------------
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  await ensureAdrDir();
  try {
    const files = await fs.readdir(ADR_DIR);
    const adrFiles = files.filter(f => f.match(/^\d{4}-.*\.md$/));

    return {
      resources: adrFiles.map(file => ({
        uri: `adr:///${file}`,
        name: `ADR: ${file}`,
        mimeType: "text/markdown",
        description: `Architecture Decision Record: ${file}`,
      })),
    };
  } catch (e) {
    return { resources: [] };
  }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  if (uri.startsWith("adr:///")) {
    const rawFilename = uri.replace("adr:///", "");
    const filename = path.basename(rawFilename); // Prevent path traversal
    const filePath = path.join(ADR_DIR, filename);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    } catch (e) {
      throw new Error(`ADR not found: ${filename}`);
    }
  }
  throw new Error("Invalid URI");
});

// -----------------------------------------------------
// 2. TOOLS: Expose explicit capabilities
// -----------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_adrs",
        description: "Lists all Architecture Decision Records (ADRs) in the current project.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "create_adr",
        description: "Creates a new Architecture Decision Record in the correct format.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "The title of the ADR" },
            status: { type: "string", description: "The status of the ADR (e.g. Proposed, Accepted, Rejected)", default: "Proposed" },
            context: { type: "string", description: "The context and problem statement" },
            decision: { type: "string", description: "The actual decision made" },
            consequences: { type: "string", description: "The consequences of the decision" },
          },
          required: ["title", "context", "decision", "consequences"],
        },
      },
      {
        name: "update_adr_status",
        description: "Updates the status of an existing Architecture Decision Record.",
        inputSchema: {
          type: "object",
          properties: {
            filename: { type: "string", description: "The filename of the ADR (e.g. '0001-use-postgresql.md')" },
            status: { type: "string", description: "The new status (e.g. 'Accepted', 'Superseded', 'Deprecated')" },
          },
          required: ["filename", "status"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  await ensureAdrDir();

  if (request.params.name === "list_adrs") {
    const files = await fs.readdir(ADR_DIR);
    const adrFiles = files.filter(f => f.match(/^\d{4}-.*\.md$/));
    if (adrFiles.length === 0) {
      return { content: [{ type: "text", text: "No ADRs found in this project." }] };
    }
    return {
      content: [{ type: "text", text: `Found ${adrFiles.length} ADRs:\n${adrFiles.join("\n")}` }],
    };
  }

  if (request.params.name === "create_adr") {
    const { title, status = "Proposed", context, decision, consequences } = request.params.arguments;

    const files = await fs.readdir(ADR_DIR);
    const adrFiles = files.filter(f => f.match(/^\d{4}-.*\.md$/));
    
    // Find the highest existing ADR number to avoid overwriting if intermediate files were deleted
    const existingNums = adrFiles.map(f => parseInt(f.match(/^\d{4}/)[0], 10));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    
    const numStr = nextNum.toString().padStart(4, "0");
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const filename = `${numStr}-${safeTitle}.md`;

    const date = new Date().toISOString().split("T")[0];

    const content = `# ${nextNum}. ${title}

Date: ${date}

## Status
${status}

## Context
${context}

## Decision
${decision}

## Consequences
${consequences}
`;

    await fs.writeFile(path.join(ADR_DIR, filename), content);

    return {
      content: [{ type: "text", text: `Successfully created ADR: ${filename}\nPath: ${path.join(ADR_DIR, filename)}` }],
    };
  }

  if (request.params.name === "update_adr_status") {
    const { filename, status } = request.params.arguments;
    
    // Prevent path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(ADR_DIR, safeFilename);

    try {
      let content = await fs.readFile(filePath, "utf-8");
      
      // Basic regex to find the status section and replace the content until the next section
      const statusRegex = /(## Status\s*\n)(.+?)(?=\n##|$)/is;
      
      if (statusRegex.test(content)) {
        content = content.replace(statusRegex, `$1${status}\n`);
      } else {
        throw new Error("Could not find '## Status' section in the ADR file.");
      }
      
      await fs.writeFile(filePath, content);
      
      return {
        content: [{ type: "text", text: `Successfully updated status of ${safeFilename} to: ${status}` }],
      };
    } catch (e) {
      throw new Error(`Failed to update ADR: ${e.message}`);
    }
  }

  throw new Error("Tool not found");
});

// -----------------------------------------------------
// 3. START SERVER
// -----------------------------------------------------
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch(console.error);
