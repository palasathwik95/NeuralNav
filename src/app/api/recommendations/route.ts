import { NextRequest, NextResponse } from "next/server";
import {
  getSkillScores,
  updateSkillScore,
  analyzeSkillGaps,
  generateRecommendations,
  getNextStepRecommendations,
  getSkillOverview,
  batchUpdateSkillScores,
} from "@/lib/recommendationEngine";
import { getProfile } from "@/lib/profileEngine";

/**
 * Recommendation Engine API Route
 * 
 * Methods:
 * - GET /api/recommendations - Get personalized course recommendations
 * - GET /api/recommendations?type=gaps - Analyze skill gaps
 * - GET /api/recommendations?type=overview - Get skill overview
 * - GET /api/recommendations?type=nextSteps&moduleId=xxx - Get next step recommendations
 * - POST /api/recommendations/skills - Update skill scores
 */

export async function GET(request: NextRequest) {
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
    const type = searchParams.get("type") || "recommendations";
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    const profile = await getProfile(userId);

    switch (type) {
      case "gaps": {
        const { gaps, recommendations } = await analyzeSkillGaps(userId, profile);
        return NextResponse.json({ gaps, recommendations });
      }

      case "overview": {
        const overview = await getSkillOverview(userId);
        return NextResponse.json(overview);
      }

      case "nextSteps": {
        const moduleId = searchParams.get("moduleId");
        if (!moduleId) {
          return NextResponse.json(
            { error: "moduleId parameter required" },
            { status: 400 }
          );
        }
        const recommendations = await getNextStepRecommendations(
          userId,
          moduleId,
          profile
        );
        return NextResponse.json(recommendations);
      }

      case "skills": {
        const skills = await getSkillScores(userId);
        return NextResponse.json(skills);
      }

      default: {
        const recommendations = await generateRecommendations(
          userId,
          profile,
          limit
        );
        return NextResponse.json(recommendations);
      }
    }
  } catch (error) {
    console.error("Error in GET /api/recommendations:", error);
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
    const { action } = body;

    switch (action) {
      case "updateSkill": {
        if (!body.skill || body.value === undefined) {
          return NextResponse.json(
            { error: "skill and value required" },
            { status: 400 }
          );
        }
        const result = await updateSkillScore(
          userId,
          body.skill,
          body.value
        );
        return NextResponse.json(result);
      }

      case "batchUpdateSkills": {
        if (!Array.isArray(body.updates)) {
          return NextResponse.json(
            { error: "updates array required" },
            { status: 400 }
          );
        }
        const results = await batchUpdateSkillScores(userId, body.updates);
        return NextResponse.json(results);
      }

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in POST /api/recommendations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to extract user ID from authorization header
 */
function extractUserIdFromAuth(authHeader: string): string | null {
  try {
    const token = authHeader.replace("Bearer ", "");
    return token || null;
  } catch {
    return null;
  }
}
