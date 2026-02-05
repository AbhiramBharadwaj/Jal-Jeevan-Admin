const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

const sendOTPEmail = async (email, otp, name) => {
  try {
    if (!RESEND_API_KEY) {
      return { success: false, error: "RESEND_API_KEY is not configured" };
    }

    const html = `
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
    `;

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [email],
        subject: "Water Management System - OTP Verification",
        html
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, error: `Resend API error: ${errorBody}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPEmail };
