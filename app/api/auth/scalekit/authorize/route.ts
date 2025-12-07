import { NextRequest, NextResponse } from "next/server";
import { ScalekitClient } from "@scalekit-sdk/node";

const ENV_URL = process.env.SCALEKIT_ENVIRONMENT_URL || "https://vivo.scalekit.dev";
const CLIENT_ID = process.env.SCALEKIT_CLIENT_ID;
const CLIENT_SECRET = process.env.SCALEKIT_CLIENT_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, email } = body;

    if (!organizationId && !email) {
      return NextResponse.json(
        { error: "Either organizationId or email is required" },
        { status: 400 }
      );
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Scalekit not configured" },
        { status: 500 }
      );
    }

    const scalekit = new ScalekitClient(ENV_URL, CLIENT_ID, CLIENT_SECRET);

    const redirectUri = `${request.nextUrl.origin}/api/auth/scalekit/callback`;

    // Generate authorization URL
    const authUrl = scalekit.getAuthorizationUrl(redirectUri, {
      ...(organizationId && { organizationId }),
      ...(email && { loginHint: email }),
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: authUrl,
    });
  } catch (error: any) {
    console.error("Scalekit authorize error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}

