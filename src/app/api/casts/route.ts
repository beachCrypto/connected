import { NextResponse } from 'next/server';

// Import KV namespace if you're using Cloudflare Workers KV
// import { CASTS_KV } from '../../path/to/your/kv-binding';

export const runtime = 'edge';

interface Cast {
  hash: string;
  thread_hash: string;
  parent_hash: string | null;
  author: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  text: string;
  timestamp: string;
  embeds: any[];
  reactions: {
    likes: number;
    recasts: number;
  };
  replies: {
    count: number;
  };
  votes: number;
  lastUpdated: string;
}

export async function GET() {
  try {
    const isProduction = process.env.VERCEL_ENV === 'production';
    const workerUrl = isProduction
      ? process.env.PRODUCTION_WORKER_URL
      : process.env.PREVIEW_WORKER_URL;

    if (!workerUrl) {
      throw new Error('Worker URL environment variable is not set');
    }

    // Fetch casts from KV storage
    const kvResponse = await fetch(workerUrl);

    if (!kvResponse.ok) {
      throw new Error(`KV responded with status: ${kvResponse.status}`);
    }

    const data: unknown = await kvResponse.json();
    if (typeof data === 'object' && data && 'storedKeys' in data && Array.isArray(data.storedKeys)) {
        const storedKeys = data.storedKeys;
        const casts: Cast[] = [];

        // Fetch each cast by its key
        for (const key of storedKeys) {
          const castResponse = await fetch(`${workerUrl}/${key}`);
          if (castResponse.ok) {
            const cast: Cast = await castResponse.json();
            casts.push(cast);
          } else {
            console.error(`Failed to fetch cast with key: ${key}`);
          }
        }

        return NextResponse.json({ casts });

    } else {
        throw new Error('Unexpected response structure');
    }

  } catch (error) {
    console.error('Error fetching casts from KV:', error);
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
}