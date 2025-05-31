// Run this script to fix the storage CORS configuration
// Usage: node run-fix-storage.js

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function runFixStorage() {
  try {
    console.log('Starting the storage CORS configuration fix process...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'supabase', 'fix-storage-cors.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('SQL script loaded successfully.');
    console.log('\nThis script will:');
    console.log('1. Update the property-photos bucket to be public');
    console.log('2. Configure CORS settings to allow access from any origin');
    console.log('3. Create a policy to allow public access to the bucket');
    console.log('4. Fix any existing property photo URLs in the database');
    
    rl.question('\nDo you want to proceed? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('\nRunning the SQL script...');
        
        // Instructions for running the script
        console.log('\nTo run this script, you need to:');
        console.log('1. Open the Supabase dashboard');
        console.log('2. Go to the SQL Editor');
        console.log('3. Create a new query');
        console.log('4. Paste the following SQL and run it:');
        console.log('\n' + '-'.repeat(80) + '\n');
        console.log(sqlContent);
        console.log('\n' + '-'.repeat(80));
        
        console.log('\nAfter running the SQL script:');
        console.log('1. Restart your application');
        console.log('2. Try uploading and viewing property photos again');
        
        rl.close();
      } else {
        console.log('Operation cancelled.');
        rl.close();
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    rl.close();
  }
}

runFixStorage();
