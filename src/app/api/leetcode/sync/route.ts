import { NextRequest, NextResponse } from 'next/server';
import { fetchLeetCodeSyncData } from '@/lib/leetcode/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = body.username;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'LeetCode username is required.',
        },
        { status: 400 }
      );
    }

    const result = await fetchLeetCodeSyncData(username);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: result.profile,
      retrievedProblems: result.retrievedProblems,
      meta: result.meta,
    });
  } catch (err) {
    console.error('Unhandled error in /api/leetcode/sync:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected server error occurred while processing the LeetCode synchronization.',
      },
      { status: 500 }
    );
  }
}
