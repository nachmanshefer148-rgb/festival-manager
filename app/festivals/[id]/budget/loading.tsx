export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-28 bg-gray-200 rounded-xl" />
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-7 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      {/* Table rows */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="h-5 w-24 bg-gray-200 rounded" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0">
            <div className="flex-1 h-4 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
