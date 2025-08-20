import { createTransport } from "nodemailer"
import { Effect, Config, Redacted } from "effect"
import { getConfigProvider } from "./config-provider"

/**
 * Email Service for Echo Stack
 *
 * Features:
 * - Development: Mailpit SMTP server (localhost:1025)
 * - Production: Resend API
 * - Effect Config for environment variables
 */

interface EmailData {
  to: string
  name: string
  subject: string
  html: string
}

/**
 * Email configuration with Effect Config
 */
const EmailConfig = Effect.gen(function* () {
  const configProvider = getConfigProvider()

  const program = Effect.gen(function* () {
    const environment = yield* Config.literal(
      "development",
      "production",
      "test",
    )("NODE_ENV")
    const resendApiKey = yield* Config.redacted("RESEND_API_KEY")
    const resendFromEmail = yield* Config.string("RESEND_FROM_EMAIL")
    const betterAuthUrl = yield* Config.string("BETTER_AUTH_URL")

    return {
      environment,
      resendApiKey,
      resendFromEmail,
      betterAuthUrl,
    }
  })

  return yield* program.pipe(Effect.withConfigProvider(configProvider))
})

/**
 * Create email transporter based on environment
 */
const createEmailTransporter = async () => {
  const config = await Effect.runPromise(EmailConfig)

  if (config.environment === "development") {
    // Use Mailpit for development
    return createTransport({
      host: "localhost",
      port: 1025,
      secure: false, // Mailpit doesn't use TLS
      tls: {
        rejectUnauthorized: false,
      },
    })
  }

  // Use Resend for production
  return createTransport({
    host: "smtp.resend.com",
    port: 587,
    secure: false,
    auth: {
      user: "resend",
      pass: Redacted.value(config.resendApiKey),
    },
  })
}

/**
 * Send email with basic error handling
 */
const sendEmail = async (emailData: EmailData) => {
  const transporter = await createEmailTransporter()
  const config = await Effect.runPromise(EmailConfig)

  const fromEmail =
    config.environment === "development"
      ? "noreply@localhost"
      : config.resendFromEmail

  console.log(
    "📧 Sending email to:",
    emailData.to,
    "Subject:",
    emailData.subject,
  )

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    })

    console.log("✅ Email sent successfully to:", emailData.to)
  } catch (error) {
    console.error("❌ Email sending failed:", error)
    throw new Error(`Email sending failed: ${error}`)
  }
}

/**
 * Send email verification email
 */
export const sendVerificationEmail = async ({
  to,
  name,
  verificationUrl,
}: {
  to: string
  name: string
  verificationUrl: string
}) => {
  await sendEmail({
    to,
    name,
    subject: "Welcome! Verify your email",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Echo Stack</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Echo Stack ✈️</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Single-seat full-stack starter</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Hi ${name}! 👋</h2>
            <p style="color: #555; line-height: 1.6; margin: 0 0 25px 0;">
              Welcome to Echo Stack! We're excited to help you build amazing applications. 
              To get started, please verify your email address by clicking the button below.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 16px 32px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: 600; 
                        font-size: 16px;
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                        transition: all 0.2s ease;">
                ✅ Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 25px 0 0 0;">
              <strong>Didn't create an account?</strong><br>
              If you didn't sign up for this application, you can safely ignore this email.
            </p>
            
            <!-- Link fallback -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 13px; margin: 0;">
                Having trouble with the button? Copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This verification link will expire in 24 hours for security.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async ({
  to,
  name,
  resetUrl,
}: {
  to: string
  name: string
  resetUrl: string
}) => {
  await sendEmail({
    to,
    name,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Hey ${name}! 🔐</h1>
        <p>We received a request to reset your password. Click the link below to set a new password.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour for security.
        </p>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link: <br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `,
  })
}
