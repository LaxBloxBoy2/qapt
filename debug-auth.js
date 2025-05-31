const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugAuth() {
  try {
    console.log('🔍 Debugging Authentication Issues...\n');

    // 1. Check if we can connect to Supabase
    console.log('1. Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      if (connectionError.code === '42P01') {
        console.log('💡 The user_profiles table does not exist!');
        console.log('   You need to create it first.');
        return;
      }
    } else {
      console.log('✅ Connected to Supabase successfully');
      console.log(`   Found ${connectionTest.length} user profiles\n`);
    }

    // 2. Check current session
    console.log('2. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      return;
    }

    if (!session) {
      console.log('❌ No active session found');
      console.log('   Try logging in first\n');
      return;
    }

    console.log('✅ Active session found');
    console.log(`   User ID: ${session.user.id}`);
    console.log(`   Email: ${session.user.email}\n`);

    // 3. Check if user profile exists
    console.log('3. Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError.message);
      console.log(`   Error code: ${profileError.code}`);

      if (profileError.code === 'PGRST116') {
        console.log('💡 Profile does not exist for this user');
        console.log('   This is likely the root cause of the login issue');
      }
      return;
    }

    console.log('✅ Profile found:');
    console.log(`   Full name: ${profile.full_name}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Created: ${profile.created_at}\n`);

    // 4. Test RLS policies
    console.log('4. Testing RLS policies...');
    const { data: allProfiles, error: rlsError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role');

    if (rlsError) {
      console.error('❌ RLS test failed:', rlsError.message);
    } else {
      console.log(`✅ RLS working - can see ${allProfiles.length} profile(s)`);
    }

    console.log('\n🎉 Authentication debugging complete!');
    console.log('   Everything looks good. The issue might be elsewhere.');

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

debugAuth();
