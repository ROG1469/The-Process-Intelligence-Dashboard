export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold mb-4 text-white">
            Process Intelligence Hub
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl">
            Real-time process monitoring, bottleneck detection, and AI-powered recommendations to optimize warehouse operations.
          </p>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a href="/dashboard" className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5">
            Open Dashboard
          </a>
          <button className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44">
            Learn More
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          <div className="p-6 rounded-lg border border-gray-700 bg-gray-800/50">
            <h3 className="text-xl font-semibold mb-2 text-white">Real-time Monitoring</h3>
            <p className="text-gray-300">Track AI process performance in real-time with detailed metrics and alerts.</p>
          </div>
          <div className="p-6 rounded-lg border border-gray-700 bg-gray-800/50">
            <h3 className="text-xl font-semibold mb-2 text-white">Bottleneck Analysis</h3>
            <p className="text-gray-300">Identify performance bottlenecks and get recommendations for optimization.</p>
          </div>
          <div className="p-6 rounded-lg border border-gray-700 bg-gray-800/50">
            <h3 className="text-xl font-semibold mb-2 text-white">Smart Optimization</h3>
            <p className="text-gray-300">Automated suggestions to improve your AI pipeline efficiency.</p>
          </div>
        </div>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
        >
          Documentation
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
        >
          API Reference
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
        >
          Support
        </a>
      </footer>
    </div>
  );
}