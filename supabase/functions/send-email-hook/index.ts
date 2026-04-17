import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};
const BRAND_NAME = "VideoRemix.vip";
const BRAND_URL = "https://videoremix.vip";
const SUPPORT_EMAIL = "support@videoremix.vip";
const BRAND_COLORS = {
  primary: "#3b82f6",
  secondary: "#1e40af",
  accent: "#60a5fa",
  background: "#f8fafc",
  text: "#1e293b"
};
function generateEmailHTML(title, content, ctaText, ctaUrl, footer) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${BRAND_COLORS.text};
      background-color: ${BRAND_COLORS.background};
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .email-header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .email-body {
      padding: 40px 30px;
    }
    .email-body h2 {
      color: ${BRAND_COLORS.primary};
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: 600;
    }
    .email-body p {
      margin: 16px 0;
      color: #64748b;
      font-size: 16px;
    }
    .cta-button {
      display: inline-block;
      margin: 30px 0;
      padding: 16px 32px;
      background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .link-fallback {
      margin: 20px 0;
      padding: 16px;
      background-color: ${BRAND_COLORS.background};
      border-radius: 6px;
      word-break: break-all;
      font-size: 14px;
      color: #64748b;
    }
    .email-footer {
      padding: 30px;
      background-color: ${BRAND_COLORS.background};
      text-align: center;
      font-size: 14px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }
    .email-footer p {
      margin: 8px 0;
    }
    .email-footer a {
      color: ${BRAND_COLORS.primary};
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>${BRAND_NAME}</h1>
    </div>
    <div class="email-body">
      <h2>${title}</h2>
      ${content}
      ${ctaUrl ? `<a href="${ctaUrl}" class="cta-button">${ctaText}</a>` : ''}
      ${ctaUrl ? `<div class="link-fallback">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: ${BRAND_COLORS.text};">Or copy and paste this link:</p>
        <p style="margin: 0;">${ctaUrl}</p>
      </div>` : ''}
      <div class="divider"></div>
      <p style="font-size: 14px; color: #94a3b8;">${footer}</p>
    </div>
    <div class="email-footer">
      <p><strong>${BRAND_NAME}</strong></p>
      <p>Your complete AI-powered video creation suite</p>
      <p>Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
      <p style="margin-top: 20px;">
        <a href="${BRAND_URL}">${BRAND_URL}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
function generateSignupEmail(email, confirmUrl) {
  const content = `
    <p>Welcome to ${BRAND_NAME}! 🎉</p>
    <p>We're excited to have you join our community of creators. To get started with your account and access all our powerful AI tools, please confirm your email address.</p>
    <p>Click the button below to verify your email and activate your account:</p>
  `;
  const footer = `This link will expire in 24 hours. If you didn't create an account with ${BRAND_NAME}, you can safely ignore this email.`;
  return {
    subject: `Welcome to ${BRAND_NAME} - Confirm Your Email`,
    html: generateEmailHTML("Confirm Your Email", content, "Confirm Email Address", confirmUrl, footer)
  };
}
function generateRecoveryEmail(email, resetUrl) {
  const content = `
    <p>We received a request to reset the password for your ${BRAND_NAME} account associated with ${email}.</p>
    <p>Click the button below to create a new password:</p>
  `;
  const footer = `This link will expire in 1 hour for security reasons. If you didn't request a password reset, please ignore this email or contact support if you have concerns.`;
  return {
    subject: `Reset Your ${BRAND_NAME} Password`,
    html: generateEmailHTML("Reset Your Password", content, "Reset Password", resetUrl, footer)
  };
}
function generateMagicLinkEmail(email, loginUrl) {
  const content = `
    <p>Click the button below to securely sign in to your ${BRAND_NAME} account:</p>
  `;
  const footer = `This magic link will expire in 1 hour. If you didn't request this login link, you can safely ignore this email.`;
  return {
    subject: `Sign In to ${BRAND_NAME}`,
    html: generateEmailHTML("Sign In to Your Account", content, "Sign In Now", loginUrl, footer)
  };
}
function generateInviteEmail(email, inviteUrl) {
  const content = `
    <p>You've been invited to join ${BRAND_NAME}! 🎊</p>
    <p>Get access to our complete suite of AI-powered tools for video creation, editing, branding, and more.</p>
    <p>Click the button below to accept your invitation and create your account:</p>
  `;
  const footer = `This invitation link will expire in 7 days. If you weren't expecting this invitation, you can safely ignore this email.`;
  return {
    subject: `You're Invited to ${BRAND_NAME}`,
    html: generateEmailHTML("You're Invited!", content, "Accept Invitation", inviteUrl, footer)
  };
}
function generateEmailChangeEmail(email, confirmUrl) {
  const content = `
    <p>We received a request to change the email address for your ${BRAND_NAME} account to ${email}.</p>
    <p>Click the button below to confirm this change:</p>
  `;
  const footer = `This link will expire in 24 hours. If you didn't request this change, please contact support immediately at ${SUPPORT_EMAIL}.`;
  return {
    subject: `Confirm Email Change for ${BRAND_NAME}`,
    html: generateEmailHTML("Confirm Email Change", content, "Confirm New Email", confirmUrl, footer)
  };
}
Deno.serve(async (req)=>{
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Method not allowed"
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const payload = await req.json();
    const { user, email_data } = payload;
    let emailContent;
    let actionUrl = "";
    switch(email_data.email_action_type){
      case "signup":
        actionUrl = `${BRAND_URL}/auth/confirm?token=${email_data.token_hash}&type=signup&redirect_to=${encodeURIComponent(email_data.redirect_to || BRAND_URL)}`;
        emailContent = generateSignupEmail(user.email, actionUrl);
        break;
      case "recovery":
        actionUrl = `${BRAND_URL}/auth/confirm?token=${email_data.token_hash}&type=recovery&redirect_to=${encodeURIComponent(email_data.redirect_to || BRAND_URL)}`;
        emailContent = generateRecoveryEmail(user.email, actionUrl);
        break;
      case "magiclink":
        actionUrl = `${BRAND_URL}/auth/confirm?token=${email_data.token_hash}&type=magiclink&redirect_to=${encodeURIComponent(email_data.redirect_to || BRAND_URL)}`;
        emailContent = generateMagicLinkEmail(user.email, actionUrl);
        break;
      case "invite":
        actionUrl = `${BRAND_URL}/auth/confirm?token=${email_data.token_hash}&type=invite&redirect_to=${encodeURIComponent(email_data.redirect_to || BRAND_URL)}`;
        emailContent = generateInviteEmail(user.email, actionUrl);
        break;
      case "email_change":
        actionUrl = `${BRAND_URL}/auth/confirm?token=${email_data.token_hash}&type=email_change&redirect_to=${encodeURIComponent(email_data.redirect_to || BRAND_URL)}`;
        emailContent = generateEmailChangeEmail(user.email, actionUrl);
        break;
      default:
        throw new Error(`Unknown email action type: ${email_data.email_action_type}`);
    }
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VideoRemix <noreply@videoremix.vip>',
        to: [user.email],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Resend API error: ${errorText}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Email sent successfully via Resend"
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error in send-email-hook:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
