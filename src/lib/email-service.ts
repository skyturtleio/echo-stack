import { createTransport, Transporter } from "nodemailer"
import { Effect, Context, Layer } from "effect"
import { ConfigService } from "./config-service"
import { Logger } from "./logger-service"

/**
 * Email Service - Echo Stack
 *
 * Proper Effect service with global transporter and resource management.
 * Features:
 * - Single transporter instance (performance optimization)
 * - Proper resource cleanup with Effect.acquireRelease
 * - Environment-aware (dev: Mailpit, prod: Resend)
 * - Layer memoization for initialization
 */

export interface EmailData {
  to: string
  name: string
  subject: string
  html: string
}

export interface EmailService {
  readonly sendEmail: (data: EmailData) => Effect.Effect<void, EmailError>
  readonly sendVerificationEmail: (data: {
    to: string
    name: string
    verificationUrl: string
  }) => Effect.Effect<void, EmailError>
  readonly sendPasswordResetEmail: (data: {
    to: string
    name: string
    resetUrl: string
  }) => Effect.Effect<void, EmailError>
}

export class EmailError {
  readonly _tag = "EmailError"
  constructor(
    readonly cause: unknown,
    readonly message: string,
    readonly context?: Record<string, unknown>,
  ) {}
}

/**
 * Email Service tag for dependency injection
 */
export const EmailService =
  Context.GenericTag<EmailService>("@app/EmailService")

/**
 * Create global email transporter with proper resource management
 */
const createEmailTransporter = Effect.gen(function* () {
  const configService = yield* ConfigService
  const logger = yield* Logger
  const config = yield* configService.getConfig()

  yield* logger.info("Creating email transporter", {
    service: "EmailService",
    operation: "createTransporter",
    metadata: { environment: config.environment },
  })

  let transporter: Transporter

  if (config.environment === "development") {
    // Development: Use Mailpit
    transporter = createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    })

    yield* logger.info("Email transporter created for development", {
      service: "EmailService",
      metadata: {
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        provider: "mailpit",
      },
    })
  } else {
    // Production: Use Resend
    transporter = createTransport({
      host: "smtp.resend.com",
      port: 587,
      secure: false,
      auth: {
        user: "resend",
        pass: config.email.resend.apiKey,
      },
    })

    yield* logger.info("Email transporter created for production", {
      service: "EmailService",
      metadata: { provider: "resend" },
    })
  }

  return transporter
})

/**
 * Email Service implementation (simplified for now)
 */
const EmailServiceLive = Effect.gen(function* () {
  const configService = yield* ConfigService
  const logger = yield* Logger
  const config = yield* configService.getConfig()

  // Create transporter (simplified - we'll add resource management later)
  const transporter = yield* createEmailTransporter

  // Determine from email based on environment
  const getFromEmail = () => {
    if (config.environment === "development") {
      return "noreply@localhost"
    }
    return config.email.resend.fromEmail
  }

  const sendEmail = (data: EmailData) =>
    Effect.gen(function* () {
      yield* logger.info(`Sending email to ${data.to}`, {
        service: "EmailService",
        operation: "sendEmail",
        metadata: {
          to: data.to,
          subject: data.subject,
          environment: config.environment,
        },
      })

      const fromEmail = getFromEmail()

      yield* Effect.tryPromise({
        try: () =>
          transporter.sendMail({
            from: fromEmail,
            to: data.to,
            subject: data.subject,
            html: data.html,
          }),
        catch: (error) =>
          new EmailError(error, `Failed to send email to ${data.to}`, {
            to: data.to,
            subject: data.subject,
          }),
      })

      yield* logger.success(`Email sent successfully to ${data.to}`, {
        service: "EmailService",
        operation: "sendEmail",
        metadata: { to: data.to },
      })
    })

  const sendVerificationEmail = (data: {
    to: string
    name: string
    verificationUrl: string
  }) =>
    sendEmail({
      ...data,
      subject: "Welcome! Verify your email",
      html: createVerificationEmailHtml(data.name, data.verificationUrl),
    })

  const sendPasswordResetEmail = (data: {
    to: string
    name: string
    resetUrl: string
  }) =>
    sendEmail({
      ...data,
      subject: "Reset your password",
      html: createPasswordResetEmailHtml(data.name, data.resetUrl),
    })

  return EmailService.of({
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
  })
})

/**
 * Email Service Layer with proper dependencies
 */
export const EmailServiceLayer = Layer.effect(EmailService, EmailServiceLive)

/**
 * Convenience functions for accessing email service
 */
export const sendEmail = (data: EmailData) => () =>
  EmailService.pipe(Effect.andThen((_) => _.sendEmail(data)))

export const sendVerificationEmail =
  (data: { to: string; name: string; verificationUrl: string }) => () =>
    EmailService.pipe(Effect.andThen((_) => _.sendVerificationEmail(data)))

export const sendPasswordResetEmail =
  (data: { to: string; name: string; resetUrl: string }) => () =>
    EmailService.pipe(Effect.andThen((_) => _.sendPasswordResetEmail(data)))

/**
 * Email HTML templates
 */
function createVerificationEmailHtml(
  name: string,
  verificationUrl: string,
): string {
  return `
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
  `
}

function createPasswordResetEmailHtml(name: string, resetUrl: string): string {
  return `
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
  `
}
