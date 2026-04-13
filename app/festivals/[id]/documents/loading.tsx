export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-28 bg-gray-200 rounded-xl" />
      {[1, 2, 3].map((section) => (
        <div key={section} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <div className="h-5 w-5 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
          <div className="p-3 space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 bg-gray-100 rounded-lg shrink-0" />
                <div className="flex-1 h-4 bg-gray-100 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
