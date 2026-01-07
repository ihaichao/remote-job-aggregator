import { JobList } from '@/components/JobList';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Remote Job Aggregator
          </h1>
          <p className="text-gray-600 mt-1">
            Aggregating remote software development jobs from across the web
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <JobList />
      </div>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          Data sources: V2EX, RemoteOK, and more
        </div>
      </footer>
    </main>
  );
}
