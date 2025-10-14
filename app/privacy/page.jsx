"use client";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

const Privacy = () => {
  return (
    <main className="bg-white text-black">
      <div
        className="mx-4 mt-4 width-full flex itmes-center justify-center mb-16"
        href={"/"}
      >
        <Link href={"/"} className="text-xl font-bold text-center">
          MyLyfe
        </Link>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8 mt-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> Jun 27, 2024.
        </p>

        <p className="mb-8">
          MyLyfe ("we," "our," "us") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, and share
          information when you use our website, mobile applications, and other
          online products and services (collectively, the "Services").
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          1. Information We Collect
        </h2>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          a. Information You Provide to Us
        </h3>
        <ul className="list-disc pl-5 mb-8">
          <li className="mb-2">
            <strong>Account Information:</strong> When you create an account
            with us, we collect your name, email address, and other relevant
            details.
          </li>
          <li>
            <strong>User-Generated Content:</strong> We collect information that
            you provide directly through the Services, such as the sources you
            create or other content you submit.
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          b. Information We Collect Automatically
        </h3>
        <ul className="list-disc pl-5 mb-8">
          <li>
            <strong>Usage Information:</strong> We collect information about
            your use of the Services, including the pages you visit, the links
            you click, and other actions you take.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          2. How We Use Your Information
        </h2>
        <p className="mb-4">
          We use the information we collect for various purposes, including:
        </p>
        <ul className="list-disc pl-5 mb-8">
          <li className="mb-2">
            <strong>Providing and Improving the Services:</strong> To operate
            and maintain our Services, to improve the user experience, and to
            develop new features.
          </li>
          <li className="mb-2">
            <strong>Communications:</strong> To communicate with you about your
            account, to respond to your inquiries, and to provide you with
            updates and other information.
          </li>
          <li>
            <strong>Security:</strong> To protect the security and integrity of
            our Services and to detect and prevent fraud.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          3. How We Share Your Information
        </h2>
        <p className="mb-4">
          We do not share your personal information with third parties except in
          the following circumstances:
        </p>
        <ul className="list-disc pl-5 mb-8">
          <li className="mb-2">
            <strong>Service Providers:</strong> We may share your information
            with third-party service providers who assist us in operating our
            Services.
          </li>
          <li className="mb-2">
            <strong>Legal Requirements:</strong> We may disclose your
            information if required to do so by law or in response to a legal
            process, such as a court order or subpoena.
          </li>
          <li>
            <strong>Business Transfers:</strong> In the event of a merger,
            acquisition, or sale of all or a portion of our assets, your
            information may be transferred as part of the transaction.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          4. Your Choices and Rights
        </h2>
        <p className="mb-4">
          You have certain rights and choices regarding your personal
          information:
        </p>
        <ul className="list-disc pl-5 mb-8">
          <li className="mb-2">
            <strong>Access and Update:</strong> You may access and update your
            account information at any time by logging into your account.
          </li>
          <li>
            <strong>Data Deletion:</strong> You may request that we delete your
            personal information by contacting us at{" "}
            <a
              href="mailto:theo.htf.chan@gmail.com"
              className="text-blue-600 hover:underline"
            >
              theo.htf.chan@gmail.com
            </a>
            . Please note that certain information may be retained for legal or
            legitimate business purposes.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Security</h2>
        <p className="mb-8">
          We implement reasonable security measures to protect your information
          from unauthorized access, use, or disclosure. However, no method of
          transmission over the internet or electronic storage is completely
          secure, and we cannot guarantee the absolute security of your
          information.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          6. Children's Privacy
        </h2>
        <p className="mb-8">
          Our Services are not directed to children under the age of 13, and we
          do not knowingly collect personal information from children under 13.
          If we become aware that we have collected personal information from a
          child under 13, we will take steps to delete such information.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          7. Changes to This Privacy Policy
        </h2>
        <p className="mb-8">
          We may update this Privacy Policy from time to time to reflect changes
          in our practices or for other operational, legal, or regulatory
          reasons. We will notify you of any significant changes by posting the
          updated policy on our website and indicating the date of the latest
          revision.
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
        <p className="mb-8">
          If you have any questions or concerns about this Privacy Policy or our
          practices, please contact us at:
        </p>
        <p className="mb-4">
          <strong>MyLyfe</strong>
          <br />
          Email:{" "}
          <a
            href="mailto:theo.htf.chan@gmail.com"
            className="text-blue-600 hover:underline"
          >
            theo.htf.chan@gmail.com
          </a>
        </p>
      </div>
      <Footer />
    </main>
  );
};

export default Privacy;
