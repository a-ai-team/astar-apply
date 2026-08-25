import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-6 px-8 py-24 text-center">
        <Image
          src="/logo.png"
          alt="A* Apply logo"
          width={256}
          height={256}
          priority
          className="h-64 w-64 rounded-full"
        />
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          A* Apply
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Spring week &amp; finance application tracker. Coming soon.
        </p>
      </main>
    </div>
  );
}
