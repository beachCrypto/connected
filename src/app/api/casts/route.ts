import { NextResponse } from 'next/server';
import { KVNamespace } from '@cloudflare/workers-types';

// Import KV namespace if you're using Cloudflare Workers KV
// import { CASTS_KV } from '../../path/to/your/kv-binding';

export const runtime = 'edge';

interface Env {
  CASTS_KV: KVNamespace;
}

interface Cast {
  hash: string;
  votes: number;
  lastUpdated: string;
  [key: string]: any;
}

export async function GET(request: Request) {
  try {
    const env = process.env as unknown as Env;
    const { CASTS_KV } = env;

    if (!CASTS_KV) {
      throw new Error('CASTS_KV is not defined');
    }

    // List all keys in the KV store
    const listResult = await CASTS_KV.list();
    const castPromises = listResult.keys.map(async (key) => {
      const castData = await CASTS_KV.get(key.name, 'json');
      return castData as Cast;
    });

    const casts = await Promise.all(castPromises);

    // Sort casts by votes (descending) and then by lastUpdated (descending)
    casts.sort((a, b) => {
      if (b.votes !== a.votes) {
        return b.votes - a.votes;
      }
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });

    return NextResponse.json({ casts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching casts:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching casts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const env = process.env as unknown as Env;
    const { CASTS_KV } = env;

    if (!CASTS_KV) {
      throw new Error('CASTS_KV is not defined');
    }

    const { hash } = await request.json() as { hash: string };
    if (!hash) {
      return NextResponse.json({ error: 'Cast hash is required' }, { status: 400 });
    }

    const cast = await CASTS_KV.get<Cast>(hash, 'json');
    if (!cast) {
      return NextResponse.json({ error: 'Cast not found' }, { status: 404 });
    }

    cast.votes += 1;
    cast.lastUpdated = new Date().toISOString();
    await CASTS_KV.put(hash, JSON.stringify(cast));

    return NextResponse.json({ message: 'Upvote successful', cast }, { status: 200 });
  } catch (error) {
    console.error('Error upvoting cast:', error);
    return NextResponse.json(
      { error: 'An error occurred while upvoting the cast' },
      { status: 500 }
    );
  }
}
