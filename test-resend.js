// Quick test to verify Resend API key works
const { Resend } = require('resend');

const resend = new Resend('re_SS1UvjbV_BdQLrsP4H69hpraGjgyWJtdY');

async function testEmail() {
  try {
    console.log('🧪 Testing Resend API...');
    
    const { data, error } = await resend.emails.send({
      from: 'QAPT Team <onboarding@resend.dev>',
      to: ['delivered@resend.dev'], // Resend's test email
      subject: 'Test Email from QAPT',
      html: '<h1>Test Email</h1><p>If you receive this, Resend is working!</p>',
    });

    if (error) {
      console.error('❌ Resend test failed:', error);
    } else {
      console.log('✅ Resend test successful:', data);
    }
  } catch (err) {
    console.error('💥 Test error:', err);
  }
}

testEmail();
