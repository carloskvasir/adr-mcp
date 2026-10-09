import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs/promises";
import path from "path";

async function runTest() {
  console.log("Starting MCP Server integration test...");
  
  // Create a clean temporary workspace for testing
  const testWorkspace = "/tmp/adr-test-workspace";
  await fs.rm(testWorkspace, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(testWorkspace, { recursive: true });

  const transport = new StdioClientTransport({
    command: "node",
    args: ["./index.js", testWorkspace]
  });

  const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
  
  await client.connect(transport);
  console.log("✅ Connected to MCP Server via stdio");

  // Test 1: List Tools
  const tools = await client.listTools();
  console.log("✅ Tools available:", tools.tools.map(t => t.name).join(", "));
  if (!tools.tools.find(t => t.name === "create_adr")) throw new Error("create_adr tool missing");

  // Test 2: Call create_adr
  console.log("Testing create_adr tool...");
  const createRes = await client.callTool({
    name: "create_adr",
    arguments: {
      title: "Use MCP Server",
      context: "We need a way to test MCP.",
      decision: "We will write an integration test.",
      consequences: "Higher confidence before npm publish."
    }
  });
  console.log("✅ Create Result:", createRes.content[0].text);

  // Test 3: List ADRs tool
  console.log("Testing list_adrs tool...");
  const listRes = await client.callTool({
    name: "list_adrs",
    arguments: {}
  });
  console.log("✅ List Result:\n" + listRes.content[0].text);

  // Test 4: List Resources
  console.log("Testing listResources...");
  const resources = await client.listResources();
  console.log("✅ Resources available:", resources.resources.map(r => r.uri).join(", "));
  
  const targetUri = resources.resources[0].uri;

  // Test 5: Read Resource
  console.log(`Testing readResource for ${targetUri}...`);
  const readRes = await client.readResource({ uri: targetUri });
  console.log("✅ Read Result (First 50 chars):", readRes.contents[0].text.substring(0, 50).replace(/\n/g, " ") + "...");

  // Test 6: Update ADR Status
  console.log("Testing update_adr_status tool...");
  const updateRes = await client.callTool({
    name: "update_adr_status",
    arguments: {
      filename: "0001-use-mcp-server.md",
      status: "Accepted"
    }
  });
  console.log("✅ Update Result:", updateRes.content[0].text);

  const readResAfter = await client.readResource({ uri: targetUri });
  if (!readResAfter.contents[0].text.includes("Accepted")) throw new Error("Status was not updated");
  console.log("✅ Verified status is now Accepted");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The package is ready to publish.");
  process.exit(0);
}

runTest().catch(err => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
