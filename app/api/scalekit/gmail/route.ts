import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/scalekit-clean";

// Minimal Scalekit API:
// - Only generates an authorization URL using the official Node SDK
// - Does NOT try to call undocumented Agent Actions HTTP endpoints

// For this MVP, we assume you have a Gmail connection configured in Scalekit
// and know its connectionId. Replace this with your actual connectionId.
const GMAIL_CONNECTION_ID = process.env.SCALEKIT_GMAIL_CONNECTION_ID || "gmail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action !== "get_authorization_url") {
      return NextResponse.json(
        {
          error:
            "Unsupported action. For this MVP only `get_authorization_url` is implemented.",
        },
        { status: 400 }
      );
    }

    // For connection-based OAuth (like Gmail tools), Scalekit expects the
    // connection callback URL that is configured in the dashboard.
    // You can override this via SCALEKIT_REDIRECT_URI if needed.
    const redirectUri =
      process.env.SCALEKIT_REDIRECT_URI ||
      "https://vivo.scalekit.dev/sso/v1/oauth/conn_101249370812319244/callback";

    const data = getAuthorizationUrl({
      connectionId: GMAIL_CONNECTION_ID,
      redirectUri,
      state: "gmail-connection",
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Scalekit API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to get Scalekit authorization URL",
      },
      { status: 500 }
    );
  }
}
