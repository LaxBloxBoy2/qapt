#!/usr/bin/env node

/**
 * This script helps with setting up Supabase for QAPT.
 * It provides instructions and commands to create the necessary tables and policies.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\x1b[32m%s\x1b[0m', '🚀 QAPT Supabase Setup Helper');
console.log('\x1b[36m%s\x1b[0m', '===============================');
console.log('');
console.log('This script will help you set up Supabase for QAPT.');
console.log('');

const steps = [
  {
    title: 'Create a Supabase Project',
    instructions: [
      '1. Go to https://app.supabase.io and sign in',
      '2. Click "New Project"',
      '3. Enter a name for your project (e.g., "qapt")',
      '4. Choose a database password (save it somewhere secure)',
      '5. Choose a region close to your users',
      '6. Click "Create new project"'
    ]
  },
  {
    title: 'Get Your Supabase API Keys',
    instructions: [
      '1. In your Supabase project dashboard, go to Project Settings > API',
      '2. Copy the "URL" and "anon" key',
      '3. Create a .env.local file in the root of your project with:',
      '   NEXT_PUBLIC_SUPABASE_URL=your-project-url',
      '   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key'
    ]
  },
  {
    title: 'Create Database Schema',
    instructions: [
      '1. In your Supabase project dashboard, go to the SQL Editor',
      '2. Click "New Query"',
      '3. Copy and paste the contents of supabase/schema.sql',
      '4. Click "Run" to execute the SQL'
    ]
  },
  {
    title: 'Configure Authentication',
    instructions: [
      '1. In your Supabase project dashboard, go to Authentication > Settings',
      '2. Under "Site URL", add your local development URL (e.g., http://localhost:3000)',
      '3. Under "Redirect URLs", add:',
      '   - http://localhost:3000/login',
      '   - http://localhost:3000/signup',
      '   - http://localhost:3000/dashboard',
      '4. Click "Save"'
    ]
  }
];

function displayStep(step, index) {
  console.log('');
  console.log('\x1b[33m%s\x1b[0m', `Step ${index + 1}: ${step.title}`);
  console.log('\x1b[36m%s\x1b[0m', '-'.repeat(step.title.length + 9));
  step.instructions.forEach(instruction => {
    console.log(instruction);
  });
}

function createEnvFile() {
  console.log('');
  console.log('\x1b[33m%s\x1b[0m', 'Creating .env.local file');
  console.log('\x1b[36m%s\x1b[0m', '-----------------------');
  
  rl.question('Enter your Supabase URL: ', (url) => {
    rl.question('Enter your Supabase anon key: ', (anonKey) => {
      const envContent = `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`;
      
      fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
      
      console.log('');
      console.log('\x1b[32m%s\x1b[0m', '✅ .env.local file created successfully!');
      console.log('');
      
      rl.close();
      
      console.log('\x1b[32m%s\x1b[0m', '🎉 Setup complete!');
      console.log('');
      console.log('You can now start the development server with:');
      console.log('\x1b[36m%s\x1b[0m', 'npm run dev');
      console.log('');
      console.log('Visit http://localhost:3000 to see your app in action.');
    });
  });
}

// Display all steps
steps.forEach(displayStep);

// Ask if the user wants to create the .env.local file
console.log('');
rl.question('Do you want to create the .env.local file now? (y/n) ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    createEnvFile();
  } else {
    rl.close();
    
    console.log('');
    console.log('\x1b[33m%s\x1b[0m', 'Remember to create the .env.local file manually before starting the app.');
    console.log('');
    console.log('\x1b[32m%s\x1b[0m', '🎉 Setup instructions complete!');
    console.log('');
    console.log('After setting up Supabase and creating your .env.local file, you can start the development server with:');
    console.log('\x1b[36m%s\x1b[0m', 'npm run dev');
    console.log('');
    console.log('Visit http://localhost:3000 to see your app in action.');
  }
});
