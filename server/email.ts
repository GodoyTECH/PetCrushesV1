export type OtpDeliveryResult = {
  delivered: boolean;
  provider: "resend" | "dev-console";
};

const DEFAULT_FROM = "PetCrushes <no-reply@petcrushes.local>";

export async function sendOtpEmail(email: string, code: string, expiresAt: Date): Promise<OtpDeliveryResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;

  if (!resendApiKey) {
    console.log(`[OTP][DEV-FALLBACK] email=${email} code=${code} expiresAt=${expiresAt.toISOString()}`);
    return { delivered: false, provider: "dev-console" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Seu código de acesso - PetCrushes",
      html: `<p>Seu código de acesso é <strong>${code}</strong>.</p><p>Ele expira em ${expiresAt.toISOString()}.</p>`,
      text: `Seu código de acesso é ${code}. Ele expira em ${expiresAt.toISOString()}.`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[email][resend] failed status=${response.status} body=${body}`);
    console.log(`[OTP][DEV-FALLBACK] email=${email} code=${code} expiresAt=${expiresAt.toISOString()}`);
    return { delivered: false, provider: "dev-console" };
  }

  return { delivered: true, provider: "resend" };
}
