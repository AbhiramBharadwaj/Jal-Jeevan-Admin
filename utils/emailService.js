// utils/emailService.js
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

// Load environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const REDIRECT_URI = "https://developers.google.com/oauthplayground"; // can stay as-is
const EMAIL_USER = process.env.EMAIL_USER;

// Configure OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

/**
 * Send OTP email using Gmail API + Nodemailer
 */
const sendOTPEmail = async (email, otp, name) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: EMAIL_USER,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: "Water Management System - OTP Verification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Water Management System</h2>
          <p>Dear ${name},</p>
          <p>Your OTP for verification is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; text-align: center;">
            <h1 style="color: #1f2937; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP is valid for 10 minutes only.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">Water Management System Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPEmail };
