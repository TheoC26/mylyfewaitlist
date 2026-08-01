import { APP_STORE_URL } from "@/lib/launch";

/**
 * What replaces the waitlist form the moment the app is live.
 *
 * The Android row is a <span>, not an <a> or a disabled <button>. A link that
 * goes nowhere is worse than a label — it invites a click and then does
 * nothing, which reads as broken rather than as "not yet". A plain labelled
 * element says the true thing.
 */
export default function LaunchCTA() {
  return (
    <div className="sm:mx-auto sm:max-w-xl lg:mx-0">
      <div className="sm:flex sm:gap-3">
        <a
          href={APP_STORE_URL}
          className="block w-full rounded-md bg-black px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 sm:w-auto sm:px-8"
        >
          Download on the App Store
        </a>

        <span
          aria-disabled="true"
          className="mt-3 block w-full cursor-default rounded-md border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-400 sm:mt-0 sm:w-auto sm:px-8"
        >
          Android - coming soon
        </span>
      </div>
    </div>
  );
}
