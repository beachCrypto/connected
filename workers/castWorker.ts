import { KVNamespace } from '@cloudflare/workers-types';

interface Cast {
  hash: string;
  votes: number;
  lastUpdated: string;
  [key: string]: any; // For other properties of the cast object
}

interface ApiResponse {
  casts: Cast[];
}

interface UpvoteBody {
  action: 'upvote' | 'downvote';
  hash: string;
}

interface Env {
  CASTS_KV: KVNamespace;
  NEYNAR_API_KEY: string;
}

const API_LIMIT = 5; // Maximum number of API calls per minute
const API_LIMIT_WINDOW = 60; // Time window in seconds (1 minute)

async function checkRateLimit(): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - API_LIMIT_WINDOW;

  try {
    // Get the current API call count
    const apiCallsString = await CASTS_KV.get('api_calls');
    let apiCalls: number[] = apiCallsString ? JSON.parse(apiCallsString) : [];

    // Remove timestamps outside the current window
    apiCalls = apiCalls.filter(timestamp => timestamp > windowStart);

    if (apiCalls.length >= API_LIMIT) {
      return false; // Rate limit exceeded
    }

    // Add current timestamp and update KV
    apiCalls.push(now);
    await CASTS_KV.put('api_calls', JSON.stringify(apiCalls));

    return true; // Rate limit not exceeded
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return false; // Assume rate limit exceeded on error
  }
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    // Add a KV read operation for GET requests
    const keys = await CASTS_KV.list();
    return new Response(JSON.stringify({
      message: 'Worker is running!',
      storedKeys: keys.keys.map(k => k.name)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();

      if (typeof body === 'object' && body !== null && 'action' in body && ['upvote', 'downvote'].includes((body as UpvoteBody).action)) {
        // Handle upvote or downvote
        const { hash, action } = body as UpvoteBody;
        if (!hash) {
          return new Response(JSON.stringify({ error: 'Cast hash is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const cast = await CASTS_KV.get<Cast>(hash, 'json');
        if (!cast) {
          return new Response(JSON.stringify({ error: 'Cast not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        cast.votes += action === 'upvote' ? 1 : -1;
        cast.lastUpdated = new Date().toISOString();
        await CASTS_KV.put(hash, JSON.stringify(cast));

        return new Response(JSON.stringify({ message: `${action} successful`, cast }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Handle retrieving casts
        return fetchAndProcessCasts();
      }
    } catch (error) {
      console.error('Error processing request:', error);
      return new Response(JSON.stringify({ error: 'An error occurred while processing the request' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function fetchAndProcessCasts(): Promise<Response> {
  // Check rate limit
  const canProceed = await checkRateLimit();
  if (!canProceed) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded. Please try again later.'
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fetch casts from the API
  const apiResponse = await fetch(
    'https://api.neynar.com/v2/farcaster/feed?feed_type=filter&filter_type=channel_id&channel_id=base&members_only=true&with_recasts=false&limit=100',
    {
      headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY }
    }
  );

  if (!apiResponse.ok) {
    throw new Error(`API request failed with status ${apiResponse.status}`);
  }

  const apiData: ApiResponse = await apiResponse.json();

  let newCasts = 0;
  let updatedCasts = 0;
  let verifiedCasts = 0;

  // Process and store casts
  for (const cast of apiData.casts) {
    try {
      console.log(`Processing cast: ${cast.hash}`);
      const existingCast = await CASTS_KV.get<Cast>(cast.hash, 'json');
      if (!existingCast) {
        // New cast
        const newCast: Cast = {
          ...cast,
          votes: 0,
          lastUpdated: new Date().toISOString()
        };
        console.log(`Storing new cast: ${cast.hash}`);
        await CASTS_KV.put(cast.hash, JSON.stringify(newCast));
        newCasts++;
      } else {
        // Existing cast - update if necessary
        const updatedCast: Cast = {
          ...existingCast,
          ...cast,
          votes: existingCast.votes, // Preserve existing votes
          lastUpdated: new Date().toISOString()
        };
        if (JSON.stringify(existingCast) !== JSON.stringify(updatedCast)) {
          console.log(`Updating existing cast: ${cast.hash}`);
          await CASTS_KV.put(cast.hash, JSON.stringify(updatedCast));
          updatedCasts++;
        }
      }

      // Verify the cast was stored correctly
      const verifiedCast = await CASTS_KV.get<Cast>(cast.hash, 'json');
      if (verifiedCast) {
        verifiedCasts++;
        console.log(`Verified cast ${cast.hash} is stored correctly`);
      } else {
        console.error(`Failed to verify cast ${cast.hash}`);
      }

    } catch (error) {
      console.error(`Error processing cast ${cast.hash}:`, error);
      // Continue processing other casts
    }
  }

  console.log(`Processed ${newCasts} new casts, updated ${updatedCasts} casts, and verified ${verifiedCasts} casts`);

  return new Response(JSON.stringify({
    message: 'Casts processed',
    newCasts,
    updatedCasts,
    verifiedCasts
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request);
  },
};