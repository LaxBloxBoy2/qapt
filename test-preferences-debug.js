// Test script to debug preferences issues
// Run this in the browser console on the settings page

async function testPreferences() {
  console.log('🔍 Testing Preferences Functionality');
  
  // Check if user is authenticated
  const { data: { user }, error: userError } = await window.supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ User not authenticated:', userError);
    return;
  }
  
  console.log('✅ User authenticated:', user.id);
  
  // Test 1: Check if user_preferences table exists and is accessible
  console.log('\n1️⃣ Testing table access...');
  try {
    const { data, error } = await window.supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('❌ Error accessing user_preferences table:', error);
    } else {
      console.log('✅ Table accessible. Current preferences:', data);
    }
  } catch (err) {
    console.error('❌ Exception accessing table:', err);
  }
  
  // Test 2: Test the get_user_preferences function
  console.log('\n2️⃣ Testing get_user_preferences function...');
  try {
    const { data, error } = await window.supabase
      .rpc('get_user_preferences', { p_user_id: user.id });
    
    if (error) {
      console.error('❌ Error calling get_user_preferences:', error);
    } else {
      console.log('✅ get_user_preferences works:', data);
    }
  } catch (err) {
    console.error('❌ Exception calling function:', err);
  }
  
  // Test 3: Test direct update
  console.log('\n3️⃣ Testing direct update...');
  try {
    const { data, error } = await window.supabase
      .from('user_preferences')
      .update({
        currency: 'GBP',
        default_currency_symbol: '£',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select();
    
    if (error) {
      console.error('❌ Error updating preferences:', error);
      console.error('❌ Error details:', error.message, error.code, error.details);
    } else {
      console.log('✅ Direct update successful:', data);
    }
  } catch (err) {
    console.error('❌ Exception during update:', err);
  }
  
  // Test 4: Check final state
  console.log('\n4️⃣ Checking final state...');
  try {
    const { data, error } = await window.supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('❌ Error checking final state:', error);
    } else {
      console.log('✅ Final state:', data);
    }
  } catch (err) {
    console.error('❌ Exception checking final state:', err);
  }
  
  console.log('\n🎉 Test completed!');
}

// Make supabase available globally for testing
if (typeof window !== 'undefined') {
  // This will be available in the browser console
  window.testPreferences = testPreferences;
  console.log('💡 Run testPreferences() in the console to debug preferences');
}
