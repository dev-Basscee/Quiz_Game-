import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <header className="max-w-5xl mx-auto mb-8">
        <h1 className="text-3xl font-bold">Quiz Game Host</h1>
        <p className="text-gray-600">React host dashboard is running.</p>
      </header>

      <main className="max-w-5xl mx-auto grid gap-6">
        <section className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Getting Started</h2>
          </div>
          <div className="card-body">
            <ol className="list-decimal ml-6 space-y-2">
              <li>Create or load a quiz</li>
              <li>Start a game session</li>
              <li>Share the game code with players</li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  )
}
