const https = require('https');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://auaytfzunufzzkurjlol.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Extract the hostname from the URL
const hostname = new URL(supabaseUrl).hostname;

// Test URL for a public file in the image_url bucket
const testUrl = `${supabaseUrl}/storage/v1/object/public/image_url/test-cors-${Date.now()}.txt`;

console.log('Checking CORS configuration...');
console.log(`Testing URL: ${testUrl}`);

// Make an OPTIONS request to check CORS headers
const options = {
  hostname: hostname,
  port: 443,
  path: '/storage/v1/object/public/image_url',
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'Content-Type'
  }
};

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  // Check for CORS headers
  const corsHeaders = [
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers',
    'access-control-max-age'
  ];
  
  console.log('\nCORS Headers Check:');
  let hasCorsHeaders = false;
  
  corsHeaders.forEach(header => {
    if (res.headers[header]) {
      console.log(`✅ ${header}: ${res.headers[header]}`);
      hasCorsHeaders = true;
    } else {
      console.log(`❌ ${header}: Missing`);
    }
  });
  
  if (!hasCorsHeaders) {
    console.log('\n⚠️ No CORS headers found. This might cause issues with loading images.');
    console.log('You need to configure CORS in the Supabase dashboard:');
    console.log('1. Go to Project Settings > API > CORS');
    console.log('2. Add * to the allowed origins (or your specific domain)');
    console.log('3. Save the changes');
  } else {
    console.log('\n✅ CORS headers are present.');
  }
  
  // Now make a GET request to test actual access
  console.log('\nTesting GET request to a public file...');
  
  const getOptions = {
    hostname: hostname,
    port: 443,
    path: '/storage/v1/object/public/image_url',
    method: 'GET',
    headers: {
      'Origin': 'http://localhost:3000'
    }
  };
  
  const getReq = https.request(getOptions, (getRes) => {
    console.log('GET Status Code:', getRes.statusCode);
    console.log('GET CORS Headers:');
    
    if (getRes.headers['access-control-allow-origin']) {
      console.log(`✅ access-control-allow-origin: ${getRes.headers['access-control-allow-origin']}`);
    } else {
      console.log('❌ access-control-allow-origin: Missing');
    }
    
    console.log('\nCORS check completed.');
  });
  
  getReq.on('error', (error) => {
    console.error('Error making GET request:', error.message);
  });
  
  getReq.end();
});

req.on('error', (error) => {
  console.error('Error making OPTIONS request:', error.message);
});

req.end();
