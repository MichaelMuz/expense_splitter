export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Expense Splitter
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Type-safe, LLM-friendly, powered by Bun
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Frontend:</span>
            <span>React 19 + Vite + Tailwind</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Backend:</span>
            <span>Express + Prisma + PostgreSQL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Runtime:</span>
            <span>Bun</span>
          </div>
        </div>
        <p className="mt-6 text-center text-green-600 font-semibold">
          ✓ Stack initialized successfully!
        </p>
      </div>
    </div>
  )
}
