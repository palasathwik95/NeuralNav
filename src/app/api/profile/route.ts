import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateProfile,
  getProfile,
  updateProfile,
  applyProfileDelta,
  addXP,
  updateStreak,
  logActivity,
  getRecentActivity,
} from "@/lib/profileEngine";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Profile API Route
 * 
 * Methods:
 * - GET /api/profile - Fetch current user's profile (or create if doesn't exist)
 * - POST /api/profile - Create/update profile with initial data
 * - PATCH /api/profile - Apply incremental updates (delta) to profile
 * - PUT /api/profile/xp - Add XP and handle level ups
 * - PUT /api/profile/streak - Update streak
 * - POST /api/profile/activity - Log activity for a day
 * - GET /api/profile/activity - Get recent activity logs
 */

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract userId from auth (simplified - in production use proper JWT verification)
    const userId = extractUserIdFromAuth(authHeader);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const profile = await getProfile(userId);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error in GET /api/profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = extractUserIdFromAuth(authHeader);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    
    // Map camelCase to snake_case for database
    const initialData = {
      name: body.name,
      goal: body.goal,
      level: body.level,
      weeklyHours: body.weeklyHours,
      style: body.style,
      interests: body.interests,
    };

    const profile = await getOrCreateProfile(userId, initialData);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error in POST /api/profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = extractUserIdFromAuth(authHeader);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if this is a delta or full update
    if (body.isDelta) {
      // Apply delta (incremental changes)
      const profile = await applyProfileDelta(userId, body.delta);
      return NextResponse.json({ success: true, profile });
    } else {
      // Full update
      const profile = await updateProfile(userId, body);
      return NextResponse.json(profile);
    }
  } catch (error) {
    console.error("Error in PATCH /api/profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle XP addition
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = extractUserIdFromAuth(authHeader);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "xp") {
      const body = await request.json();
      const result = await addXP(userId, body.amount || 0);
      return NextResponse.json(result);
    } else if (action === "streak") {
      const newStreak = await updateStreak(userId);
      return NextResponse.json({ newStreak });
    } else if (action === "activity") {
      const body = await request.json();
      await logActivity(userId, body.minutes || 0, body.day);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error in PUT /api/profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle GET activity
async function getActivity(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = extractUserIdFromAuth(authHeader);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const activity = await getRecentActivity(userId);
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error in GET /api/profile/activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to extract user ID from authorization header
 * In production, implement proper JWT verification using supabase-js
 */
function extractUserIdFromAuth(authHeader: string): string | null {
  try {
    // This is a simplified version
    // In production: const { data: { user }, error } = await supabaseServer.auth.getUser()
    const token = authHeader.replace("Bearer ", "");
    // For now, return a placeholder - real implementation would decode JWT
    return token || null;
  } catch {
    return null;
  }
}
