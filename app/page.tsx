import ConsequenceMapper from "@/components/ConsequenceMapper";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <span className="text-xs font-medium tracking-widest text-zinc-400 uppercase">
            AMuN — consequence mapper
          </span>
        </div>
        <ConsequenceMapper />
      </div>
    </main>
  );
}