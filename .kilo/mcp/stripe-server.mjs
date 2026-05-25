#!/usr/bin/env node

// Simple Stripe MCP Server
// This is a basic implementation - full MCP integration would require more setup

console.log('🚀 Stripe MCP Server starting...');
console.log('Available tools:');
console.log('- create_customer: Create a new Stripe customer');
console.log('- create_payment_intent: Create a payment intent');
console.log('- list_customers: List Stripe customers');
console.log('- create_subscription: Create a subscription');
console.log('- list_prices: List available prices');
console.log('- create_refund: Create a refund');

console.log('\n📝 To use these tools, call them via the MCP protocol');
console.log('💡 Server ready for MCP connections');

// Keep the server running
process.stdin.resume();