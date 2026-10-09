"use client";

export default function StudentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="text-6xl mb-4">😅</div>
      <h2 className="text-2xl font-bold text-orange-600 mb-2">Oups !</h2>
      <p className="text-gray-700 mb-6">Quelque chose s&apos;est mal passé. Pas de panique !</p>
      <button
        onClick={reset}
        className="bg-orange-500 text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-orange-600"
      >
        Réessayer
      </button>
    </div>
  );
}
