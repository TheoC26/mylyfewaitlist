"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function UserProfileRedirectPage() {
  const { id } = useParams();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (!id) return;

    const deepLink = `mylyfeapp://userprofile/${id}`;

    // Attempt to open the app
    window.location.href = deepLink;

    // If the app doesn't open, show install UI
    const timeout = setTimeout(() => {
      setShowFallback(true);
    }, 1200);

    return () => clearTimeout(timeout);
  }, [id]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      {!showFallback ? (
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-3">Opening My Lyfe…</h1>
          <p className="text-gray-500">
            If nothing happens, we’ll help you install it.
          </p>
        </div>
      ) : (
        <div className="text-center max-w-sm">
          <h1 className="text-3xl font-bold mb-3">Get MyLyfe</h1>
          <p className="text-gray-600 mb-6">
            View this profile in the MyLyfe app
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="https://apps.apple.com/app/id6758522939"
              className="w-full rounded-lg bg-black text-white py-3 font-semibold"
            >
              Download on the App Store
            </a>

            {/* <a
              href="https://play.google.com/store/apps/details?id=com.theo_c.mylyfeapp"
              className="w-full rounded-lg border border-gray-300 py-3 font-semibold text-gray-900"
            >
              Get it on Google Play
            </a> */}
          </div>
        </div>
      )}
    </main>
  );
}
