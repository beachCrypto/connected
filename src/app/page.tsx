'use client'

import { useState, useEffect } from 'react'

interface Cast {
  hash: string;
  author: {
    username: string;
    display_name: string;
  };
  text: string;
  timestamp: string;
  votes: number;
}

export default function Page() {
  const [casts, setCasts] = useState<Cast[]>([]);

  useEffect(() => {
    fetchCasts();
  }, []);

  const fetchCasts = async () => {
    try {
      const response = await fetch('https://connected-fc.pages.dev/api/casts');
      const data: unknown = await response.json();
      if (typeof data === 'object' && data && 'casts' in data && Array.isArray(data.casts)) {
        setCasts(sortCasts(data.casts));
      } else {
        throw new Error('Invalid data structure');
      }
    } catch (error) {
      console.error('Error fetching casts:', error);
    }
  };

  const sortCasts = (castsToSort: Cast[]) => {
    return castsToSort.sort((a, b) => {
      if (b.votes !== a.votes) {
        return b.votes - a.votes;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  };

  const handleUpvote = async (hash: string) => {
    try {
      const response = await fetch('https://connected-fc.pages.dev/api/casts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hash }),
      });

      if (response.ok) {
        const updatedCasts = casts.map(cast =>
          cast.hash === hash ? { ...cast, votes: cast.votes + 1 } : cast
        );
        setCasts(sortCasts(updatedCasts));
      } else {
        console.error('Failed to upvote cast');
      }
    } catch (error) {
      console.error('Error upvoting cast:', error);
    }
  };

  return (
    <div className="bg-blue-50 min-h-screen">
      <header className="bg-blue-500 p-2">
        <nav className="max-w-6xl mx-auto flex flex-wrap items-center justify-between">
          <span className="font-bold text-white mr-4 text-lg sm:text-xl">Base Channel News</span>
          <div className="flex space-x-3 text-sm sm:text-base">
            <a href="#" className="text-blue-200 hover:text-white">new</a>
            <a href="#" className="text-blue-200 hover:text-white">past</a>
            <a href="#" className="text-blue-200 hover:text-white">comments</a>
            <a href="#" className="text-blue-200 hover:text-white">submit</a>
          </div>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto p-4">
        <ol className="list-none">
          {casts.map((cast, index) => (
            <li key={cast.hash} className="mb-4 flex items-start">
              <div className="mr-2 mt-1">
                <button
                  className="upvote-button"
                  onClick={() => handleUpvote(cast.hash)}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M5 0L10 10H0Z" fill="#828282" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="break-words">
                  <a href="#" className="text-blue-800 hover:underline text-sm sm:text-base">{cast.text}</a>
                  <span className="text-gray-500 text-xs sm:text-sm ml-1">
                    (by {cast.author?.username ?? 'unknown'})
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {cast.votes} points | {new Date(cast.timestamp).toLocaleString()} |
                  <a href="#" className="hover:underline ml-1">discuss</a>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </main>
      <footer className="border-t border-blue-300 mt-4 py-4 text-center text-xs sm:text-sm text-gray-600">
        <a href="#" className="hover:underline">Slop</a> |
        <a href="#" className="hover:underline ml-2">Channel Builder Demo</a> |
        <a href="https://warpcast.com/beachmfer.eth" className="hover:underline ml-2">Contact beachmfer.eth</a>
      </footer>
    </div>
  )
}
