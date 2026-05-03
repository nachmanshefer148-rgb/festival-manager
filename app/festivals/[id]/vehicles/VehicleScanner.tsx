"use client";

import { useEffect, useRef, useState } from "react";

interface ScanResult {
  driverName: string;
  plate: string;
  vendorName: string | null;
  notes: string | null;
  valid: boolean;
  message?: string;
}

interface Props {
  festivalId: string;
  onClose: () => void;
}

export default function VehicleScanner({ festivalId, onClose }: Props) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerInstance = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function initScanner() {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerInstance.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            if (!mounted) return;
            await scanner.stop();
            await handleScan(decodedText);
          },
          undefined
        );
      } catch {
        if (mounted) setError("לא ניתן לפתוח מצלמה. אשר הרשאות.");
      }
    }

    initScanner();

    return () => {
      mounted = false;
      scannerInstance.current?.stop().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleScan(text: string) {
    // Extract vehicle id from URL: /festivals/[id]/vehicles/scan?id=VEHICLE_ID
    try {
      const url = new URL(text);
      const vehicleId = url.searchParams.get("id");
      if (!vehicleId) throw new Error();
      await lookupVehicle(vehicleId);
    } catch {
      // Try direct id
      if (text.length > 5) {
        await lookupVehicle(text);
      } else {
        setError("QR לא תקין");
      }
    }
  }

  async function lookupVehicle(vehicleId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}?festivalId=${festivalId}`);
      if (!res.ok) throw new Error("לא נמצא");
      const data = await res.json() as ScanResult;
      setResult(data);
    } catch {
      setResult({ valid: false, driverName: "", plate: "", vendorName: null, notes: null, message: "רכב לא נמצא בפסטיבל זה" });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    window.location.reload();
  }

  return (
    <div className="space-y-4" dir="rtl">
      {!result && !error && (
        <>
          <p className="text-sm text-gray-500 text-center">כוון את המצלמה לקוד ה-QR שעל האישור</p>
          <div id="qr-reader" ref={scannerRef} className="w-full rounded-xl overflow-hidden" />
          {loading && <p className="text-center text-sm text-violet-600">מחפש רכב...</p>}
        </>
      )}

      {error && (
        <div className="text-center py-4">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={reset} className="mt-4 text-sm text-violet-600 underline">נסה שוב</button>
        </div>
      )}

      {result && (
        <div className="text-center py-4">
          <div className="text-5xl mb-3">{result.valid ? "✅" : "❌"}</div>
          {result.valid ? (
            <>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{result.driverName}</h3>
              <p className="text-2xl font-mono font-bold text-violet-700" dir="ltr">{result.plate}</p>
              {result.vendorName && <p className="text-sm text-gray-500 mt-1">{result.vendorName}</p>}
              {result.notes && <p className="text-xs text-gray-400 mt-1">{result.notes}</p>}
              <p className="mt-3 text-emerald-600 font-semibold text-sm">אישור כניסה תקין</p>
            </>
          ) : (
            <p className="text-red-600 font-medium">{result.message ?? "לא נמצא"}</p>
          )}
          <button onClick={onClose} className="mt-4 bg-violet-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition">
            סגור
          </button>
        </div>
      )}
    </div>
  );
}
