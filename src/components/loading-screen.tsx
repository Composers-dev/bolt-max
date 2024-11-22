export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
      <div className="text-gray-600">Loading...</div>
    </div>
  )
} 