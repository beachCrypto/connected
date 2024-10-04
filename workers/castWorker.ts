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

const apiKey = NEYNAR_API_KEY;
const API_LIMIT = 5; // Maximum number of API calls per minute
const API_LIMIT_WINDOW = 60; // Time window in seconds (1 minute)

addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(handleRequest(event.request));
});

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

  try {
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
      'https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=base&with_recasts=true&with_replies=false&limit=25&should_moderate=false',
      {
        headers: { 'accept': 'application/json', 'api_key': apiKey || '' }
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

  } catch (error: unknown) {
    console.error('Error in handleRequest:', error);

    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({
      error: 'An error occurred while processing casts',
      details: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}