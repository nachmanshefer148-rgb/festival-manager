export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-32 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-14 bg-gray-100 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
