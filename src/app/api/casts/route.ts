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
}

interface NeynarResponse {
  casts: Cast[];
}

export async function GET() {
  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    const apiUrl = 'https://api.neynar.com/v2/farcaster/feed?feed_type=filter&filter_type=parent_url&parent_url=https%3A%2F%2Fwarpcast.com%2F~%2Fchannel%2Fbase&with_recasts=false&limit=25';

    const response = await fetch(apiUrl, {
      headers: {
        'accept': 'application/json',
        'api_key': apiKey || ''
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data: NeynarResponse = await response.json();

    if (!data.casts || !Array.isArray(data.casts)) {
      console.error('Unexpected data structure:', data);
      return NextResponse.json({ error: 'Invalid data structure' }, { status: 500 });
    }

    // Process casts
    for (const cast of data.casts) {
      console.log('Processing cast:', cast.hash);
      // TODO: Implement your storage logic here
      // For example, if you're using a database:
      // await db.casts.upsert({ where: { hash: cast.hash }, create: cast, update: cast });
    }

    return NextResponse.json({ message: 'Casts processed successfully' });

  } catch (error) {
    console.error('Error processing casts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}