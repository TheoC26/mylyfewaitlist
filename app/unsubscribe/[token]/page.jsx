"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

const API_BASE = (process.env.NEXT_PUBLIC_MYLYFE_API_BASE || "").replace(
  /\/$/,
  "",
);

/**
 * One-click unsubscribe, required in any bulk email we send.
 *
 * Unsubscribing never deletes the signup — position decides who is inside the
 * first 1000, and silently renumbering everyone behind them because one person
 * wanted fewer emails would be wrong. It only stops mail.
 */
export default function UnsubscribePage() {
  const { token } = useParams();
  const [status, setStatus] = useState("working");

  useEffect(() => {
    fetch(`${API_BASE}/api/waitlist/unsubscribe/${token}`)
      .then((res) => setStatus(res.ok ? "done" : "invalid"))
      .catch(() => setStatus("error"));
  }, [token]);

  const copy = {
    working: { title: "One moment…", body: "Updating your preferences." },
    done: {
      title: "You're unsubscribed.",
      body: "We won't email you again. You're still on the waitlist. Nothing about your spot has changed.",
    },
    invalid: {
      title: "This link isn't valid.",
      body: "Try the unsubscribe link at the bottom of a more recent email.",
    },
    error: {
      title: "Something went wrong.",
      body: "Refresh in a moment, or email team.mylyfe@gmail.com and we'll take care of it.",
    },
  }[status];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="mt-4 mb-16 flex items-center justify-center">
          <Link href="/" className="text-xl font-bold">
            MyLyfe
          </Link>
        </div>
        <div className="mx-auto max-w-xl px-4 pb-24 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-black">
            {copy.title}
          </h1>
          <p className="mt-4 text-base text-gray-500">{copy.body}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
