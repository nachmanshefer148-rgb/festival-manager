"use client";

import { useState } from "react";

interface Props {
  artistToken: string;
}

export default function ArtistLinkButton({ artistToken }: Props) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const base = window.location.origin;
    const url = `${base}/artist/${artistToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        copyLink();
      }}
      title="העתק לינק לאמן"
      className="text-xs px-2 py-1 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors whitespace-nowrap"
    >
      {copied ? "✓ הועתק" : "🔗 לינק"}
    </button>
  );
}
