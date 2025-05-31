const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the .env.local file
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse the environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
    // Set the environment variable
    process.env[key] = value;
  }
});

// Log the environment variables (without sensitive values)
console.log('Environment variables loaded:');
Object.keys(envVars).forEach(key => {
  if (key.includes('KEY')) {
    console.log(`${key}=***********`);
  } else {
    console.log(`${key}=${envVars[key]}`);
  }
});

// Run the fix-image-urls-encoding.cjs script
try {
  console.log('\nRunning fix-image-urls-encoding.cjs...\n');
  require('./fix-image-urls-encoding.cjs');
} catch (error) {
  console.error('Error running script:', error);
  process.exit(1);
}
