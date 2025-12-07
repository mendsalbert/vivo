import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { chatWithLabReport } from "@/lib/gemini";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Get auth token from header
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create Supabase client with user's access token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Set the session to enable RLS
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: "",
    });

    const body = await req.json();
    const { reportId, question, userId } = body;

    if (!reportId || !question || !userId) {
      return NextResponse.json(
        { error: "Report ID, question, and user ID are required" },
        { status: 400 }
      );
    }

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Ensure userId matches authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    // Get the lab report to find the raw text and AI analysis
    const { data: labReport, error: fetchError } = await supabase
      .from("lab_reports")
      .select("raw_text, ai_analysis, structured_data")
      .eq("id", reportId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !labReport) {
      return NextResponse.json(
        { error: "Lab report not found" },
        { status: 404 }
      );
    }

    // Use the stored raw text (primary) and AI analysis (secondary) for chat
    const rawText = labReport.raw_text;
    const aiAnalysis = labReport.ai_analysis;

    if (!rawText || rawText.trim().length === 0) {
      console.error("Lab report has no raw text. Report ID:", reportId);
      return NextResponse.json(
        { error: "Lab report text not available. Please re-upload the report." },
        { status: 400 }
      );
    }

    console.log("Chat request - Report ID:", reportId, "Question length:", question.length, "Raw text length:", rawText.length, "Analysis length:", aiAnalysis?.length || 0);

    // Chat with the lab report using raw text and analysis
    let answer: string;
    try {
      answer = await chatWithLabReport(rawText, aiAnalysis, question);
      console.log("Chat response generated, length:", answer.length);
    } catch (error: any) {
      console.error("Chat error:", error);
      return NextResponse.json(
        {
          error: "Failed to get answer from AI",
          details: error.message || String(error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat request",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

