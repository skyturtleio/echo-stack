/**
 * Test Email Service with Mailpit
 *
 * This script tests if our email service is working correctly
 * by sending a test email through Mailpit.
 */

import {
  sendVerificationEmailBridge,
  sendPasswordResetEmailBridge,
} from "../../src/lib/email-service"

async function testEmailService() {
  console.log("📧 Testing Email Service with Mailpit...")
  console.log("   Make sure Mailpit is running: mailpit")
  console.log("   Web UI should be available at: http://localhost:8025")

  try {
    // Test 1: Send verification email
    console.log("\n📨 Sending test verification email...")
    await sendVerificationEmailBridge({
      to: "test@example.com",
      name: "Test User",
      verificationUrl: "http://localhost:3000/auth/verify-email?token=test123",
    })
    console.log("✅ Verification email sent successfully")

    // Test 2: Send password reset email
    console.log("\n🔐 Sending test password reset email...")
    await sendPasswordResetEmailBridge({
      to: "test@example.com",
      name: "Test User",
      resetUrl: "http://localhost:3000/auth/reset-password?token=reset456",
    })
    console.log("✅ Password reset email sent successfully")

    console.log("\n🎉 Email Service Test: PASSED")
    console.log("\n📬 Check Mailpit Web UI:")
    console.log("   1. Open: http://localhost:8025")
    console.log("   2. You should see 2 test emails")
    console.log("   3. Click on emails to view content")

    console.log("\n✨ Phase 2 Email Testing Complete!")
  } catch (error) {
    console.error("❌ Email service test failed:")
    console.error(error)
    console.log("\n🔧 Troubleshooting:")
    console.log("   1. Make sure Mailpit is running: mailpit")
    console.log("   2. Check that localhost:1025 is available")
    console.log("   3. Verify no firewall blocking SMTP")
    process.exit(1)
  }
}

// Run the test
testEmailService()
