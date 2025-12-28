"use client";
import Footer from "@/components/Footer";
import Link from "next/link";
import React from "react";

const Terms = () => {
  return (
    <main className="bg-white text-black">
      <div className="mx-4 mt-4 width-full flex items-center justify-center mb-16">
        <Link href={"/"} className="text-xl font-bold text-center">
          My Lyfe
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:py-8 mt-0 pb-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> December 28, 2025
        </p>

        <div className="bg-gray-50 border-l-4 border-yellow-500 p-4 mb-8">
          <p className="text-sm text-gray-700">
            <strong>Please read carefully:</strong> These terms contain a
            binding arbitration clause and a class action waiver. They affect
            your legal rights. By using My Lyfe, you agree to these terms in
            full.
          </p>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          1. Acceptance of Terms
        </h2>
        <p className="mb-8">
          By accessing or using My Lyfe (the "Service"), you agree to be bound
          by these Terms of Service and all applicable laws and regulations. If
          you do not agree with any of these terms, you are prohibited from
          using or accessing this site.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          2. User Accounts and Responsibility
        </h2>
        <p className="mb-4">
          When you create an account, you must provide accurate information. You
          are solely responsible for:
        </p>
        <ul className="list-disc pl-5 mb-8 space-y-2">
          <li>Maintaining the confidentiality of your account credentials.</li>
          <li>All activities that occur under your account.</li>
          <li>
            Any content or data you upload, post, or otherwise provide to the
            Service.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          3. User Content "At Your Own Risk"
        </h2>
        <p className="mb-8">
          You retain ownership of the content you post. However, you grant My
          Lyfe a worldwide, non-exclusive, royalty-free license to use, host,
          and display that content.{" "}
          <strong>We do not back up your data.</strong> You acknowledge that My
          Lyfe is not responsible for the loss of any content or data you
          provide.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4 uppercase">
          4. Disclaimer of Warranties
        </h2>
        <p className="mb-8 bg-gray-50 p-4 font-mono text-sm border">
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." MY LYFE MAKES NO
          WARRANTIES, EXPRESSED OR IMPLIED, AND HEREBY DISCLAIMS AND NEGATES ALL
          OTHER WARRANTIES INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OR
          CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
          NON-INFRINGEMENT OF INTELLECTUAL PROPERTY. WE DO NOT WARRANT THAT THE
          SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4 uppercase">
          5. Limitation of Liability
        </h2>
        <p className="mb-8">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL
          MY LYFE OR ITS SUPPLIERS BE LIABLE FOR ANY CONSEQUENTIAL, INCIDENTAL,
          INDIRECT, SPECIAL, OR PUNITIVE DAMAGES WHATSOEVER (INCLUDING, WITHOUT
          LIMITATION, DAMAGES FOR LOSS OF BUSINESS PROFITS, BUSINESS
          INTERRUPTION, LOSS OF BUSINESS INFORMATION, OR OTHER PECUNIARY LOSS)
          ARISING OUT OF THE USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE
          HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          6. Indemnification
        </h2>
        <p className="mb-8">
          You agree to defend, indemnify, and hold harmless My Lyfe and its
          employees, contractors, and officers from and against any and all
          claims, damages, obligations, losses, liabilities, costs, or debt, and
          expenses (including but not limited to attorney's fees) resulting from
          your use of the Service or your violation of these Terms.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          7. Termination
        </h2>
        <p className="mb-8">
          We may terminate or suspend your account and bar access to the Service
          immediately, without prior notice or liability, under our sole
          discretion, for any reason whatsoever, including without limitation a
          breach of the Terms.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          8. Governing Law
        </h2>
        <p className="mb-8">
          Any claim relating to My Lyfe shall be governed by the laws of your
          jurisdiction (e.g., the State of Delaware) without regard to its
          conflict of law provisions.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          9. Changes
        </h2>
        <p className="mb-8">
          We reserve the right, at our sole discretion, to modify or replace
          these Terms at any time. By continuing to access or use our Service
          after those revisions become effective, you agree to be bound by the
          revised terms.
        </p>

        <p className="mt-12 text-gray-600">
          If you have questions about these Terms, please contact us at{" "}
          <a
            href="mailto:team.mylyfe@gmail.com"
            className="text-blue-600 underline"
          >
            team.mylyfe@gmail.com
          </a>
          .
        </p>
      </div>
      <Footer />
    </main>
  );
};

export default Terms;
