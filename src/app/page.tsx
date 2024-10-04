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
  console.log('First cast:', casts[0])

  return (
    <ul>
      test
      {casts.map((cast) => (
        <li key={cast.hash}>
          <strong>{cast.author?.display_name ?? 'Unknown Author'} (@{cast.author?.username ?? 'Unknown Username'})</strong>
          <p>{cast.text}</p>
          <small>{new Date(cast.timestamp).toLocaleString()}</small>
        </li>
      ))}
    </ul>
  )
}
