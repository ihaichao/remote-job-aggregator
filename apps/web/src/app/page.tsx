import { JobList } from '@/components/JobList';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            专为中国开发者打造的远程工作聚合平台
          </h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <JobList />
      </div>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          数据来源：V2EX
        </div>
      </footer>
    </main>
  );
}
