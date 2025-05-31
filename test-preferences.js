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

async function testPreferences() {
  console.log('🧪 Testing Preferences System...\n');
  
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
    console.log(`Using test user ID: ${testUserId}\n`);
    
    // Test 1: Check if tables exist
    console.log('1️⃣ Checking tables...');
    
    const tables = ['user_preferences', 'notification_settings', 'user_subscriptions'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
    // Test 2: Test helper functions
    console.log('\n2️⃣ Testing helper functions...');
    
    try {
      const { data: prefs, error: prefsError } = await supabase
        .rpc('get_user_preferences', { p_user_id: testUserId });
      
      if (prefsError) {
        console.log('❌ get_user_preferences:', prefsError.message);
      } else {
        console.log('✅ get_user_preferences: OK');
        console.log('   Currency:', prefs.currency);
        console.log('   Theme:', prefs.theme);
      }
    } catch (err) {
      console.log('❌ get_user_preferences:', err.message);
    }
    
    try {
      const { data: notifs, error: notifsError } = await supabase
        .rpc('get_notification_settings', { p_user_id: testUserId });
      
      if (notifsError) {
        console.log('❌ get_notification_settings:', notifsError.message);
      } else {
        console.log('✅ get_notification_settings: OK');
        console.log('   Email enabled:', notifs.email_enabled);
        console.log('   In-app enabled:', notifs.in_app_enabled);
      }
    } catch (err) {
      console.log('❌ get_notification_settings:', err.message);
    }
    
    try {
      const { data: sub, error: subError } = await supabase
        .rpc('get_user_subscription', { p_user_id: testUserId });
      
      if (subError) {
        console.log('❌ get_user_subscription:', subError.message);
      } else {
        console.log('✅ get_user_subscription: OK');
        console.log('   Plan:', sub.plan_name);
        console.log('   Status:', sub.status);
      }
    } catch (err) {
      console.log('❌ get_user_subscription:', err.message);
    }
    
    // Test 3: Test updates
    console.log('\n3️⃣ Testing updates...');
    
    try {
      // Update preferences
      const { data: updatedPrefs, error: updateError } = await supabase
        .from('user_preferences')
        .update({
          currency: 'EUR',
          theme: 'dark',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', testUserId)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Update preferences:', updateError.message);
      } else {
        console.log('✅ Update preferences: OK');
        console.log('   New currency:', updatedPrefs.currency);
        console.log('   New theme:', updatedPrefs.theme);
      }
    } catch (err) {
      console.log('❌ Update preferences:', err.message);
    }
    
    console.log('\n🎉 Preferences test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function createTestData() {
  console.log('🔧 Creating test data...\n');
  
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
    console.log(`Creating test data for user: ${testUserId}\n`);
    
    // Create preferences
    const { error: prefError } = await supabase
      .rpc('get_user_preferences', { p_user_id: testUserId });
    
    if (prefError) {
      console.log('❌ Failed to create preferences:', prefError.message);
    } else {
      console.log('✅ Test preferences created');
    }
    
    // Create notification settings
    const { error: notifError } = await supabase
      .rpc('get_notification_settings', { p_user_id: testUserId });
    
    if (notifError) {
      console.log('❌ Failed to create notification settings:', notifError.message);
    } else {
      console.log('✅ Test notification settings created');
    }
    
    // Create subscription
    const { error: subError } = await supabase
      .rpc('get_user_subscription', { p_user_id: testUserId });
    
    if (subError) {
      console.log('❌ Failed to create subscription:', subError.message);
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
    await testPreferences();
  }
}

main();
