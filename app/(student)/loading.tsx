export default function StudentLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-bounce rounded-full bg-orange-400 [animation-delay:0ms]" />
          <span className="inline-block h-4 w-4 animate-bounce rounded-full bg-pink-400 [animation-delay:150ms]" />
          <span className="inline-block h-4 w-4 animate-bounce rounded-full bg-yellow-400 [animation-delay:300ms]" />
          <span className="inline-block h-4 w-4 animate-bounce rounded-full bg-green-400 [animation-delay:450ms]" />
        </div>
        <p className="text-sm font-semibold text-orange-600">
          Chargement en cours...
        </p>
      </div>
    </div>
  );
}
