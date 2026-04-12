export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-24 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <div className="w-full aspect-square bg-gray-200 rounded-xl" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-14 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
