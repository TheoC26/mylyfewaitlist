"use client";

import { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";

/**
 * The email capture, plus what happens after it succeeds.
 *
 * The success state is where the video-wall invite actually starts. We already
 * know the person's slot by the time this renders, so the link goes up
 * immediately rather than making them wait for the email — someone who is
 * enthusiastic enough to act right now should not have to alt-tab to their
 * inbox. The email still goes out, because most people are not going to record
 * a video in the ten seconds after typing their address, and the link needs to
 * still be there tomorrow.
 */

function makeConfetti() {
  var duration = 1.5 * 1000;
  var animationEnd = Date.now() + duration;
  var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 20 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  var interval = setInterval(function () {
    var timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    var particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [joined, setJoined] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    if (!email) {
      setMessage("Email is required.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/add_to_waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setJoined(data);
        setEmail("");
        makeConfetti();
      } else {
        setMessage(data.message || "Something went wrong.");
      }
    } catch (error) {
      setMessage("Something went wrong.");
      console.error(error);
    }
    setIsLoading(false);
  };

  if (joined) {
    const position = joined.position
      ? `#${Number(joined.position).toLocaleString("en-US")}`
      : null;

    return (
      <div className="sm:mx-auto sm:max-w-xl lg:mx-0">
        {/* Re-submitting is idempotent — same position, same token — but saying
            so matters. Without it an identical success state reads as "did that
            register?", and the likeliest reason someone submits twice is that
            they are not sure the first one worked. */}
        <p className="text-lg font-semibold text-black">
          {joined.alreadyJoined
            ? position
              ? `You're already on the list! ${position}.`
              : "You're already on the list."
            : position
              ? `You're ${position} on the list.`
              : "You're on the list."}
        </p>

        {/* token is null when the API was unreachable and only the Sheet write
            landed. The signup still counted, so say so and stop there rather
            than offering a link that cannot work. */}
        {joined.token && joined.eligible ? (
          <>
            <p className="mt-2 text-base text-gray-500">
              You&apos;re one of the first {Number(joined.cap ?? 1000).toLocaleString("en-US")} - which
              means you can put 1-5 seconds of your life on this page.
            </p>
            <Link
              href={joined.uploadPath || `/uploadvideo/${joined.token}`}
              className="mt-5 block w-full rounded-md bg-black px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:opacity-90 sm:w-auto sm:px-8 sm:inline-block"
            >
              Add your video
            </Link>
            <p className="mt-3 text-sm text-gray-400">
              We emailed you this link too, in case now isn&apos;t the moment.
            </p>
          </>
        ) : (
          <p className="mt-2 text-base text-gray-500">
            Check your email, we&apos;ll be in touch before launch. 👀
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <form className="sm:mx-auto sm:max-w-xl lg:mx-0" onSubmit={handleSubmit}>
        <div className="sm:flex">
          <div className="min-w-0 flex-1">
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="block w-full rounded-md bg-white px-4 py-2.5 text-base text-black placeholder-gray-500 outline-2 outline-black focus:outline-none focus:ring-2 focus:ring-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="mt-3 sm:mt-0 sm:ml-3">
            <button
              type="submit"
              disabled={isLoading}
              className="block w-full rounded-md outline-1 outline-[#D7D7D7] bg-[url('/BG.png')] bg-cover py-3 px-4 text-black cursor-pointer text-sm font-semibold transition-all shadow hover:opacity-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Adding..." : "Join"}
            </button>
          </div>
        </div>
      </form>
      {message && (
        <p className="mt-4 text-center text-sm font-medium text-black lg:text-left">
          {message}
        </p>
      )}
    </>
  );
}
