import { NextRequest, NextResponse } from "next/server";
import { ScalekitClient } from "@scalekit-sdk/node";
import { createClient } from "@supabase/supabase-js";

const ENV_URL =
  process.env.SCALEKIT_ENVIRONMENT_URL || "https://vivo.scalekit.dev";
const CLIENT_ID = process.env.SCALEKIT_CLIENT_ID;
const CLIENT_SECRET = process.env.SCALEKIT_CLIENT_SECRET;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error("Scalekit SSO error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/auth?error=${encodeURIComponent(errorDescription || error)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/auth?error=No authorization code received", request.url)
      );
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.redirect(
        new URL("/auth?error=Scalekit not configured", request.url)
      );
    }

    // Initialize Scalekit client
    const scalekit = new ScalekitClient(ENV_URL, CLIENT_ID, CLIENT_SECRET);

    // Exchange code for user info
    const redirectUri = `${request.nextUrl.origin}/api/auth/scalekit/callback`;
    const result = await scalekit.authenticateWithCode(code, redirectUri);

    console.log("Scalekit auth result:", {
      email: result.user.email,
      name: result.user.name,
      organizationId:
        (result as any).organizationId || (result as any).organization_id,
    });

    // Create or update user in Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("auth.users")
      .select("id")
      .eq("email", result.user.email)
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: result.user.email,
          email_confirm: true,
          user_metadata: {
            full_name: result.user.name,
            organization_id:
              (result as any).organizationId || (result as any).organization_id,
            sso_provider: "scalekit",
          },
        });

      if (createError || !newUser.user) {
        console.error("Error creating user:", createError);
        return NextResponse.redirect(
          new URL("/auth?error=Failed to create user account", request.url)
        );
      }

      userId = newUser.user.id;
    }

    // Create a session for the user
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: result.user.email,
      });

    if (sessionError || !sessionData) {
      console.error("Error creating session:", sessionError);
      return NextResponse.redirect(
        new URL("/auth?error=Failed to create session", request.url)
      );
    }

    // Redirect to the app with the session
    const response = NextResponse.redirect(new URL("/", request.url));

    // Set session cookie (you may need to adjust this based on your Supabase setup)
    response.cookies.set(
      "sb-access-token",
      sessionData.properties.hashed_token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    );

    return response;
  } catch (error: any) {
    console.error("Scalekit callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/auth?error=${encodeURIComponent(
          error.message || "Authentication failed"
        )}`,
        request.url
      )
    );
  }
}
