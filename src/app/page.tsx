import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-black font-sans">
      <main className="flex flex-col items-center gap-6 px-8 py-24 text-center">
        <Image
          src="/logo.png"
          alt="A* Apply"
          width={700}
          height={271}
          priority
          className="h-auto w-72 sm:w-[28rem]"
        />
        <p className="text-lg text-zinc-400">Coming soon.</p>
      </main>
    </div>
  );
}
