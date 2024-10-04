interface Cast {
  hash: string;
  author: {
    username: string;
    display_name: string;
  };
  text: string;
  timestamp: string;
}

export default async function Page() {
  // Fetch casts from the new API
  let data = await fetch('https://connected-fc.pages.dev/api/casts')
  let response = await data.json() as { casts: Cast[] }
  let casts = response.casts

  return (
    <div className="bg-blue-50 min-h-screen">
      <header className="bg-blue-500 p-2">
        <nav className="max-w-6xl mx-auto flex items-center">
          <span className="font-bold text-white mr-4">Base Channel News</span>
          <a href="#" className="text-blue-200 hover:text-white mr-3">new</a>
          <a href="#" className="text-blue-200 hover:text-white mr-3">past</a>
          <a href="#" className="text-blue-200 hover:text-white mr-3">comments</a>
          <a href="#" className="text-blue-200 hover:text-white">submit</a>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto p-4">
        <ol className="list-decimal list-inside">
          {casts.map((cast, index) => (
            <li key={cast.hash} className="mb-2">
              <div className="inline">
                <a href="#" className="text-blue-800 hover:underline">{cast.text}</a>
                <span className="text-gray-500 text-sm ml-1">
                  (by {cast.author?.username ?? 'unknown'})
                </span>
              </div>
              <div className="text-xs text-gray-500 ml-4">
                {index + 1} points | {new Date(cast.timestamp).toLocaleString()} |
                <a href="#" className="hover:underline ml-1">discuss</a>
              </div>
            </li>
          ))}
        </ol>
      </main>
      <footer className="border-t border-blue-300 mt-4 py-4 text-center text-sm text-gray-600">
        <a href="#" className="hover:underline">Guidelines</a> |
        <a href="#" className="hover:underline ml-2">FAQ</a> |
        <a href="#" className="hover:underline ml-2">API</a> |
        <a href="#" className="hover:underline ml-2">Security</a> |
        <a href="#" className="hover:underline ml-2">Legal</a> |
        <a href="#" className="hover:underline ml-2">Apply to YC</a> |
        <a href="#" className="hover:underline ml-2">Contact</a>
      </footer>
    </div>
  )
}
