import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const safeEnv = {
    CF_PAGES_BRANCH: process.env.CF_PAGES_BRANCH,
    PRODUCTION_WORKER_URL: process.env.PRODUCTION_WORKER_URL ? 'Set' : 'Not set',
    PREVIEW_WORKER_URL: process.env.PREVIEW_WORKER_URL ? 'Set' : 'Not set',
    // Add any other non-sensitive env vars you want to check
  };

  return NextResponse.json({ env: safeEnv });
}