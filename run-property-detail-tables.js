// Run this script to get instructions for setting up the property detail tables
// Usage: node run-property-detail-tables.js

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function runPropertyDetailTables() {
  try {
    console.log('Starting the property detail tables setup process...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'supabase', 'property-detail-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('SQL file read successfully.');
    console.log('');
    console.log('To set up the property detail tables, you need to run the SQL in the Supabase dashboard.');
    console.log('');
    console.log('Please follow these steps:');
    console.log('1. Go to the Supabase dashboard: https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Go to the SQL Editor');
    console.log('4. Create a new query');
    console.log('5. Copy and paste the following SQL:');
    console.log('');
    console.log('```sql');
    console.log(sqlContent);
    console.log('```');
    console.log('');
    console.log('6. Run the query');
    console.log('');
    console.log('After running the SQL, restart your application to use the new tables.');
    console.log('');
    
    // Ask if the user wants to open the Supabase dashboard
    rl.question('Do you want to open the Supabase dashboard? (y/n) ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('Opening the Supabase dashboard...');
        
        // Open the Supabase dashboard
        const url = 'https://app.supabase.com';
        
        // Determine the command based on the platform
        let command;
        switch (process.platform) {
          case 'darwin': // macOS
            command = `open "${url}"`;
            break;
          case 'win32': // Windows
            command = `start "" "${url}"`;
            break;
          default: // Linux and others
            command = `xdg-open "${url}"`;
            break;
        }
        
        exec(command, (error) => {
          if (error) {
            console.error('Error opening the browser:', error);
          }
        });
      }
      
      console.log('Property detail tables setup process completed!');
      
      rl.close();
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    rl.close();
  }
}

runPropertyDetailTables();
