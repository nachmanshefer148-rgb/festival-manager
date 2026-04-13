export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-9 w-48 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
              <div className="h-5 w-36 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
              <div className="h-px bg-gray-100" />
              <div className="h-3 w-28 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
