#!/usr/bin/env node

// Test script to verify Stripe MCP server
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Testing Stripe MCP Server...');

const serverPath = path.join(__dirname, 'mcp', 'stripe-server.js');

const server = spawn('node', [serverPath], {
  cwd: process.cwd(),
  env: { ...process.env },
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('Server output:', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  if (code === 0) {
    console.log('✅ MCP Server started successfully');
  } else {
    console.log('❌ MCP Server failed to start');
  }
});

// Wait a bit then test
setTimeout(() => {
  console.log('🧪 Testing MCP tools list...');

  // This is a basic test - in real usage, you'd connect via MCP protocol
  const testRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };

  server.stdin.write(JSON.stringify(testRequest) + '\n');

  // Stop after 3 seconds
  setTimeout(() => {
    server.kill();
    console.log('🛑 Test complete');
  }, 3000);

}, 2000);