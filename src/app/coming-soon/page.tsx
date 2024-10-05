import Link from 'next/link'

export default function ComingSoon() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Coming Soon</h1>
        <p className="text-xl text-gray-300 mb-8">We're working on something exciting. Stay tuned!</p>
        <Link href="/" className="text-blue-200 hover:text-white">
          Back to Home
        </Link>
      </div>
    </div>
  )
}