// Test the download endpoints directly
const testEndpoints = [
  '/download/gpt-files',
  '/download/gpt-complete-system.json',
  '/download/gpt-instructions.md',
  '/download/gpt-test-examples.md',
  '/download/COMPLETE-GPT-SETUP.md'
];

console.log('Testing download endpoints...');

testEndpoints.forEach(endpoint => {
  console.log(`Try: https://bet-bot-blipton03.replit.app${endpoint}`);
});

// Alternative: Serve files directly from their static URLs
console.log('\nDirect file URLs:');
const files = [
  'gpt-complete-system.json',
  'gpt-instructions.md', 
  'gpt-test-examples.md',
  'COMPLETE-GPT-SETUP.md'
];

files.forEach(file => {
  console.log(`Direct: https://bet-bot-blipton03.replit.app/${file}`);
});