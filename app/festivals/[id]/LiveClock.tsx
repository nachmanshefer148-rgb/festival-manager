"use client";

import { useState, useEffect } from "react";

export default function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(now.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric", year: "2-digit" }));
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="text-right">
      <p className="text-white font-mono text-lg sm:text-xl font-bold tabular-nums leading-none">
        {time || "--:--:--"}
      </p>
      <p className="text-gray-500 text-xs mt-0.5">{date}</p>
    </div>
  );
}
