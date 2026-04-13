export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-24 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-3 w-28 bg-gray-100 rounded" />
            <div className="h-px bg-gray-100" />
            <div className="flex gap-2">
              <div className="h-7 w-20 bg-gray-100 rounded-lg" />
              <div className="h-7 w-20 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
