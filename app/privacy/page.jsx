"use client";
import Footer from "@/components/Footer";
import Link from "next/link";
import React from "react";

const Privacy = () => {
  return (
    <main className="bg-white text-black">
      <div className="mx-4 mt-4 width-full flex items-center justify-center mb-16">
        <Link href={"/"} className="text-xl font-bold text-center">
          My Lyfe
        </Link>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:py-8 mt-0 pb-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> December 28, 2025
        </p>

        <section className="mb-8">
          <p className="mb-4">
            My Lyfe ("we," "our," "us") operates the website and services
            available at My Lyfe. This Privacy Policy informs you of our
            policies regarding the collection, use, and disclosure of personal
            data when you use our Services and the choices you have associated
            with that data.
          </p>
        </section>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          1. Information We Collect
        </h2>
        <div className="space-y-4 mb-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              a. Information You Provide to Us
            </h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Information:</strong> Name, email address, and
                <strong> phone number</strong>. By providing your phone number,
                you consent to receive service-related communications.
              </li>
              <li>
                <strong>User-Generated Content:</strong> Any data, text, or
                media you upload or create within the Services.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              b. Information Collected Automatically
            </h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Log and Usage Data:</strong> IP addresses, browser type,
                pages viewed, and time spent on the site.
              </li>
              <li>
                <strong>Cookies and Tracking:</strong> We use cookies and
                similar tracking technologies (like web beacons and pixels) to
                track activity on our Service and hold certain information to
                improve user experience.
              </li>
            </ul>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          2. How We Use Your Information
        </h2>
        <ul className="list-disc pl-5 mb-8 space-y-2">
          <li>
            To provide, maintain, and notify you about changes to our Service.
          </li>
          <li>
            To provide customer support and gather analysis to improve the
            Service.
          </li>
          <li>
            <strong>Communication:</strong> We may use your email or phone
            number to send newsletters, marketing, or promotional materials. You
            may opt-out via "Unsubscribe" links or by replying "STOP" to any
            SMS.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          3. Data Sharing and Disclosure
        </h2>
        <p className="mb-4">
          We do not sell your personal data. We share information only with:
        </p>
        <ul className="list-disc pl-5 mb-8 space-y-2">
          <li>
            <strong>Service Providers:</strong> Hosting (e.g., Vercel),
            Analytics (e.g., Google Analytics), and payment processors.
          </li>
          <li>
            <strong>Legal Obligations:</strong> If required by law or in
            response to valid requests by public authorities (e.g., a court or
            government agency).
          </li>
          <li>
            <strong>Business Assets:</strong> In the event of a merger or sale,
            your data remains subject to the promises made in any pre-existing
            Privacy Policy.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          4. Data Retention
        </h2>
        <p className="mb-8">
          We will retain your personal information only for as long as is
          necessary for the purposes set out in this Privacy Policy. We retain
          usage data for internal analysis purposes and to strengthen security.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          5. Your Rights (GDPR/CCPA)
        </h2>
        <p className="mb-4">
          Depending on your location, you may have the following rights:
        </p>
        <ul className="list-disc pl-5 mb-8 space-y-2">
          <li>
            The right to access, update, or delete the information we have on
            you.
          </li>
          <li>The right of rectification (to have information fixed).</li>
          <li>The right to object to or restrict processing of your data.</li>
          <li>The right to withdraw consent at any time.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          6. Security
        </h2>
        <p className="mb-8">
          The security of your data is important to us, but remember that no
          method of transmission over the Internet is 100% secure. While we
          strive to use commercially acceptable means to protect your Personal
          Data, we cannot guarantee its absolute security.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          7. Children
        </h2>
        <p className="mb-8">
          Our Service does not address anyone under the age of 13. We do not
          knowingly collect personally identifiable information from children.
          If you are a parent and aware that your child has provided us with
          data, please contact us.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          8. Contact
        </h2>
        <p className="mb-8">
          For any questions about this Privacy Policy, please contact us at:
          <br />
          <a
            href="mailto:team.mylyfe@gmail.com"
            className="text-blue-600 font-medium"
          >
            team.mylyfe@gmail.com
          </a>
        </p>
      </div>
      <Footer />
    </main>
  );
};

export default Privacy;
