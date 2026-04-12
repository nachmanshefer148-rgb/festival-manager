export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-24 bg-gray-200 rounded-xl" />
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-20 bg-gray-200 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded-full" />
            <div className="h-4 w-28 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
