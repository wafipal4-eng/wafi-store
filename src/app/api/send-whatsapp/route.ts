import { NextResponse } from "next/server";
import twilio from "twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const sender = process.env.TWILIO_PHONE_NUMBER;
const contentSid =
  process.env.TWILIO_CONTENT_SID ||
  process.env.TWILIO_CONTENT_SID_COPY_COPY_NEW_ORDER;
const notificationsEnabled =
  process.env.WHATSAPP_NOTIFICATIONS_ENABLED !== "false";

type SendRequest = {
  recipients?: string[];
  variables?: Record<string, string>;
  message?: string;
};

const asWhatsAppAddress = (phone: string) => {
  const trimmed = String(phone || "").trim();
  if (trimmed.startsWith("whatsapp:")) return trimmed;

  const normalized = trimmed.replace(/[^\d+]/g, "");
  return `whatsapp:${normalized.startsWith("+") ? normalized : `+${normalized}`}`;
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown Twilio error";

export async function POST(req: Request) {
  try {
    if (!notificationsEnabled) {
      return NextResponse.json(
        { error: "WhatsApp notifications are disabled." },
        { status: 503 }
      );
    }

    if (!accountSid || !authToken || !sender) {
      return NextResponse.json(
        { error: "Twilio WhatsApp credentials are not fully configured." },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as SendRequest;
    const recipients = (body.recipients || [])
      .filter(Boolean)
      .map((recipient) => recipient.trim());

    if (!recipients.length) {
      return NextResponse.json(
        { error: "At least one WhatsApp recipient is required." },
        { status: 400 }
      );
    }

    if (!body.message && (!contentSid || !body.variables)) {
      return NextResponse.json(
        { error: "An approved Twilio content template and variables are required." },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);
    const from = asWhatsAppAddress(sender);

    const results = await Promise.all(
      recipients.map(async (recipient) => {
        const to = asWhatsAppAddress(recipient);

        try {
          const message = body.message
            ? await client.messages.create({
                from,
                to,
                body: body.message,
              })
            : await client.messages.create({
                from,
                to,
                contentSid: contentSid!,
                contentVariables: JSON.stringify(body.variables),
              });

          return {
            to: recipient,
            success: true,
            sid: message.sid,
            status: message.status,
          };
        } catch (error: unknown) {
          console.error(`Twilio WhatsApp send failed for ${recipient}:`, error);
          return {
            to: recipient,
            success: false,
            error: errorMessage(error),
          };
        }
      })
    );

    const allFailed = results.every((result) => !result.success);
    const partialFailure =
      !allFailed && results.some((result) => !result.success);

    return NextResponse.json(
      {
        success: !allFailed,
        provider: "twilio",
        results,
        partialFailure,
      },
      { status: allFailed ? 502 : 200 }
    );
  } catch (error: unknown) {
    console.error("Twilio WhatsApp API route error:", error);
    return NextResponse.json(
      { error: errorMessage(error) },
      { status: 500 }
    );
  }
}
