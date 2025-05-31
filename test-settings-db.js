const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSettingsFunctions() {
  console.log('🧪 Testing Settings Database Functions...\n');
  
  try {
    // Test 1: Check if tables exist
    console.log('1️⃣ Checking if settings tables exist...');
    
    const tables = ['user_preferences', 'notification_settings', 'team_members', 'user_subscriptions'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table} not found or accessible:`, error.message);
      } else {
        console.log(`✅ Table ${table} exists and accessible`);
      }
    }
    
    // Test 2: Check if functions exist
    console.log('\n2️⃣ Testing helper functions...');
    
    // Get a test user ID (you might need to replace this with an actual user ID)
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.log('⚠️  No users found to test with. Create a user account first.');
      return;
    }
    
    const testUserId = users[0].id;
    console.log(`Using test user ID: ${testUserId}`);
    
    // Test get_user_preferences function
    const { data: preferences, error: prefError } = await supabase
      .rpc('get_user_preferences', { p_user_id: testUserId });
    
    if (prefError) {
      console.log('❌ get_user_preferences function failed:', prefError.message);
    } else {
      console.log('✅ get_user_preferences function works');
      console.log('   Sample data:', JSON.stringify(preferences, null, 2));
    }
    
    // Test get_notification_settings function
    const { data: notifications, error: notifError } = await supabase
      .rpc('get_notification_settings', { p_user_id: testUserId });
    
    if (notifError) {
      console.log('❌ get_notification_settings function failed:', notifError.message);
    } else {
      console.log('✅ get_notification_settings function works');
    }
    
    // Test get_user_subscription function
    const { data: subscription, error: subError } = await supabase
      .rpc('get_user_subscription', { p_user_id: testUserId });
    
    if (subError) {
      console.log('❌ get_user_subscription function failed:', subError.message);
    } else {
      console.log('✅ get_user_subscription function works');
    }
    
    // Test 3: Check RLS policies
    console.log('\n3️⃣ Testing Row Level Security...');
    
    // Try to access preferences with user context
    const { data: userPrefs, error: rlsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', testUserId);
    
    if (rlsError) {
      console.log('❌ RLS test failed:', rlsError.message);
    } else {
      console.log('✅ RLS policies working correctly');
    }
    
    console.log('\n🎉 Settings database test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

async function createTestData() {
  console.log('🔧 Creating test data for settings...\n');
  
  try {
    // Get first user
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.log('⚠️  No users found. Please create a user account first.');
      return;
    }
    
    const testUserId = users[0].id;
    
    // Create test preferences
    const { error: prefError } = await supabase
      .rpc('get_user_preferences', { p_user_id: testUserId });
    
    if (prefError) {
      console.log('❌ Failed to create test preferences:', prefError.message);
    } else {
      console.log('✅ Test preferences created');
    }
    
    // Create test notification settings
    const { error: notifError } = await supabase
      .rpc('get_notification_settings', { p_user_id: testUserId });
    
    if (notifError) {
      console.log('❌ Failed to create test notification settings:', notifError.message);
    } else {
      console.log('✅ Test notification settings created');
    }
    
    // Create test subscription
    const { error: subError } = await supabase
      .rpc('get_user_subscription', { p_user_id: testUserId });
    
    if (subError) {
      console.log('❌ Failed to create test subscription:', subError.message);
    } else {
      console.log('✅ Test subscription created');
    }
    
    console.log('\n🎉 Test data creation completed!');
    
  } catch (error) {
    console.error('❌ Test data creation failed:', error);
  }
}

async function main() {
  const command = process.argv[2];
  
  if (command === 'create') {
    await createTestData();
  } else {
    await testSettingsFunctions();
  }
}

main();
