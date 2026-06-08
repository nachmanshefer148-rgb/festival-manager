"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";

interface Props {
  festival: { name: string; startDate: Date; endDate: Date };
  artists: { id: string; name: string; genre: string | null; status: string; fee: number | null }[];
  teamMembers: { id: string; role: { name: string } }[];
  vendors: { id: string; category: string }[];
  booths: { id: string; category: string }[];
  budgetItems: { amount: number; type: string; category: string | null; isPaid: boolean }[];
  timeSlots: { startTime: string; endTime: string; artistId: string | null }[];
}

const VIOLET = ["#7c3aed", "#a855f7", "#c084fc", "#ddd6fe", "#ede9fe"];
const COLORS_BUDGET = { INCOME: "#10b981", EXPENSE: "#ef4444" };

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsDashboard({ artists, teamMembers, vendors, booths, budgetItems, timeSlots }: Props) {
  // ─── KPIs ──────────────────────────────────────────────────────────
  const totalIncome  = budgetItems.filter((b) => b.type === "INCOME").reduce((s, b) => s + b.amount, 0);
  const totalExpense = budgetItems.filter((b) => b.type === "EXPENSE").reduce((s, b) => s + b.amount, 0);
  const balance = totalIncome - totalExpense;
  const paidExpense = budgetItems.filter((b) => b.type === "EXPENSE" && b.isPaid).reduce((s, b) => s + b.amount, 0);
  const totalFees = artists.reduce((s, a) => s + (a.fee ?? 0), 0);

  // ─── Genre chart ────────────────────────────────────────────────────
  const genreMap = new Map<string, number>();
  for (const a of artists) {
    const g = a.genre?.trim() || "לא ידוע";
    genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
  }
  const genreData = [...genreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  // ─── Artist status ──────────────────────────────────────────────────
  const statusMap: Record<string, number> = {};
  for (const a of artists) statusMap[a.status] = (statusMap[a.status] ?? 0) + 1;
  const statusLabels: Record<string, string> = { confirmed: "מאושר", pending: "ממתין", cancelled: "מבוטל" };
  const statusData = Object.entries(statusMap).map(([k, v]) => ({ name: statusLabels[k] ?? k, value: v }));

  // ─── Budget by category ──────────────────────────────────────────────
  const catMap = new Map<string, { income: number; expense: number }>();
  for (const b of budgetItems) {
    const cat = b.category?.trim() || "כללי";
    if (!catMap.has(cat)) catMap.set(cat, { income: 0, expense: 0 });
    const entry = catMap.get(cat)!;
    if (b.type === "INCOME") entry.income += b.amount;
    else entry.expense += b.amount;
  }
  const budgetCatData = [...catMap.entries()]
    .map(([name, v]) => ({ name, הכנסות: v.income, הוצאות: v.expense }))
    .sort((a, b) => (b.הוצאות + b.הכנסות) - (a.הוצאות + a.הכנסות))
    .slice(0, 7);

  // ─── Performances per hour ──────────────────────────────────────────
  const hourMap: Record<number, number> = {};
  for (const s of timeSlots) {
    const h = new Date(s.startTime).getHours();
    hourMap[h] = (hourMap[h] ?? 0) + 1;
  }
  const hourData = Array.from({ length: 24 }, (_, h) => ({
    שעה: `${String(h).padStart(2, "0")}:00`,
    הופעות: hourMap[h] ?? 0,
  })).filter((d) => d.הופעות > 0 || (Object.keys(hourMap).length > 0));

  // ─── Team roles ──────────────────────────────────────────────────────
  const roleMap = new Map<string, number>();
  for (const m of teamMembers) {
    const r = m.role.name;
    roleMap.set(r, (roleMap.get(r) ?? 0) + 1);
  }
  const roleData = [...roleMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // ─── Vendor categories ───────────────────────────────────────────────
  const vendorCatMap = new Map<string, number>();
  for (const v of [...vendors, ...booths]) {
    vendorCatMap.set(v.category, (vendorCatMap.get(v.category) ?? 0) + 1);
  }
  const vendorData = [...vendorCatMap.entries()].map(([name, value]) => ({ name, value }));

  const fmt = (n: number) =>
    n >= 1000 ? `₪${(n / 1000).toFixed(0)}K` : `₪${n.toLocaleString("he-IL")}`;

  const TooltipStyle = { backgroundColor: "#1e293b", border: "none", borderRadius: 8, color: "#f1f5f9", fontSize: 12 };

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900">סיכום וסטטיסטיקות</h1>

      {/* ─── KPI row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="אמנים" value={artists.length} sub={`${statusMap["confirmed"] ?? 0} מאושרים`} />
        <KpiCard label="חברי צוות" value={teamMembers.length} />
        <KpiCard label="ספקים" value={vendors.length} />
        <KpiCard label="דוכנים" value={booths.length} />
        <KpiCard label="הכנסות" value={fmt(totalIncome)} sub={`יתרה: ${balance >= 0 ? "+" : ""}${fmt(balance)}`} />
        <KpiCard label="הוצאות" value={fmt(totalExpense)} sub={`שולם: ${fmt(paidExpense)}`} />
      </div>

      {/* ─── Row 1: Genre pie + Artist status pie ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="ז'אנרים">
          {genreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={genreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {genreData.map((_, i) => <Cell key={i} fill={VIOLET[i % VIOLET.length]} />)}
                </Pie>
                <Tooltip contentStyle={TooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="סטטוס אמנים">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, value }: { name?: string; value?: number }) => `${name ?? ""}: ${value ?? ""}`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={["#10b981", "#f59e0b", "#ef4444"][i % 3]} />)}
                </Pie>
                <Tooltip contentStyle={TooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* ─── Row 2: Budget by category ───────────────────────────────── */}
      {budgetCatData.length > 0 && (
        <ChartCard title="תקציב לפי קטגוריה">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={budgetCatData} margin={{ top: 4, right: 8, bottom: 32, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} angle={-35} textAnchor="end" />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip contentStyle={TooltipStyle} formatter={(v) => fmt(Number(v))} />
              <Bar dataKey="הכנסות" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="הוצאות" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ─── Row 3: Performances per hour + team roles ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="הופעות לפי שעה">
          {timeSlots.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="שעה" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} allowDecimals={false} />
                <Tooltip contentStyle={TooltipStyle} />
                <Area type="monotone" dataKey="הופעות" stroke="#7c3aed" fill="url(#areaGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="צוות לפי תפקיד">
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={roleData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} width={56} />
                <Tooltip contentStyle={TooltipStyle} />
                <Bar dataKey="value" name="חברים" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* ─── Row 4: Fees summary + vendor breakdown ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {totalFees > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-gray-900 text-sm">שכר אמנים</h2>
            <p className="text-3xl font-bold text-violet-700 tabular-nums">{fmt(totalFees)}</p>
            <div className="space-y-1">
              {artists.filter((a) => a.fee).sort((a, b) => (b.fee ?? 0) - (a.fee ?? 0)).slice(0, 5).map((a) => (
                <div key={a.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 truncate ml-4">{a.name}</span>
                  <span className="font-medium text-gray-900 tabular-nums shrink-0">{fmt(a.fee!)}</span>
                </div>
              ))}
              {artists.filter((a) => a.fee).length > 5 && (
                <p className="text-xs text-gray-400">ועוד {artists.filter((a) => a.fee).length - 5} אמנים...</p>
              )}
            </div>
          </div>
        )}

        {vendorData.length > 0 && (
          <ChartCard title="ספקים ודוכנים לפי קטגוריה">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={vendorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                  label={({ name, value }: { name?: string; value?: number }) => `${name ?? ""} (${value ?? ""})`} labelLine={false}>
                  {vendorData.map((_, i) => <Cell key={i} fill={VIOLET[i % VIOLET.length]} />)}
                </Pie>
                <Tooltip contentStyle={TooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <h2 className="font-semibold text-gray-900 text-sm mb-3">{title}</h2>
      {children}
    </div>
  );
}

function EmptyChart() {
  return <p className="text-sm text-gray-400 text-center py-8">אין נתונים להצגה</p>;
}
