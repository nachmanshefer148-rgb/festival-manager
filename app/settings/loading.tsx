export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="h-8 w-28 bg-gray-200 rounded-xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="h-4 w-36 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
        ))}
        <div className="h-10 w-24 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
