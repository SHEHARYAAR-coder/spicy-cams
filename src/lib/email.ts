import nodemailer from "nodemailer";

// Email configuration from environment variables
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || "",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
  fromName: process.env.EMAIL_FROM_NAME || "CryptoForex",
  fromEmail: process.env.EMAIL_FROM_EMAIL,
};

// Create a transporter object
let transporter: nodemailer.Transporter | null = null;

// Initialize the transporter
export async function initTransporter() {
  // Check if we have all required email credentials
  if (!EMAIL_CONFIG.user || !EMAIL_CONFIG.pass || !EMAIL_CONFIG.fromEmail) {
    console.warn(
      "Email credentials not found in environment variables, using test account"
    );
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("Test account created:", testAccount.user);
      console.log("Test account password:", testAccount.pass);
    } catch (error) {
      console.error("Failed to create test account:", error);
      throw error;
    }
  } else {
    // Use production email configuration
    transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: {
        user: EMAIL_CONFIG.user,
        pass: EMAIL_CONFIG.pass,
      },
    });
    console.log("Production email transporter initialized");
  }
}

// Send an email
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  // Ensure transporter is initialized
  if (!transporter) {
    console.log("Transporter not initialized, initializing now...");
    await initTransporter();
  }

  if (!transporter) {
    throw new Error("Failed to initialize email transporter");
  }

  try {
    const fromEmail = EMAIL_CONFIG.fromEmail || "test@example.com";
    const fromName = EMAIL_CONFIG.fromName;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);

    // For development, log the test URL if available
    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      console.log("Preview URL: %s", testUrl);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

// Send a verification email
export async function sendVerificationEmail(
  email: string,
  token: string,
  baseUrl?: string
) {
  const appBaseUrl =
    baseUrl || process.env.APP_BASE_URL || "http://localhost:3000";
  const verificationUrl = `${appBaseUrl}/verify?token=${token}`;
  const appName = process.env.APP_NAME || "CryptoForex";

  return sendEmail({
    to: email,
    subject: "Verify your email address",
    text: `Please verify your email address by clicking on the following link: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify your email address</h2>
        <p>Thank you for signing up with ${appName}. Please verify your email address by clicking on the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't sign up for ${appName}, you can safely ignore this email.</p>
      </div>
    `,
  });
}

// Send a password reset email
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  baseUrl?: string
) {
  const appBaseUrl =
    baseUrl || process.env.APP_BASE_URL || "http://localhost:3000";
  const resetUrl = `${appBaseUrl}/reset-password/${token}`;

  return sendEmail({
    to: email,
    subject: "Reset your password",
    text: `Reset your password by clicking on the following link: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset your password</h2>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}
