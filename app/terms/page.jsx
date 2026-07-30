"use client";
import Footer from "@/components/Footer";
import {
  ARBITRATION_OPT_OUT_DAYS,
  CONTACT_EMAIL,
  GOVERNING_STATE,
  LAST_UPDATED,
  LIABILITY_CAP,
  MIN_AGE,
  PROVIDER_LEGAL,
  SERVICE_NAME,
  VENUE,
} from "@/lib/legal";
import Link from "next/link";
import React from "react";

const H2 = ({ children }) => (
  <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-10">
    {children}
  </h2>
);

const H3 = ({ children }) => (
  <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-6">{children}</h3>
);

const P = ({ children }) => <p className="mb-4">{children}</p>;

const UL = ({ children }) => (
  <ul className="list-disc pl-5 mb-4 space-y-2">{children}</ul>
);

/** All-caps blocks: conspicuousness is a legal requirement for these, not styling. */
const Caps = ({ children }) => (
  <p className="mb-4 bg-gray-50 p-4 text-sm border border-gray-200 uppercase leading-relaxed">
    {children}
  </p>
);

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
          <strong>Last Updated:</strong> {LAST_UPDATED}
        </p>

        <div className="bg-gray-50 border-l-4 border-yellow-500 p-4 mb-8">
          <p className="text-sm text-gray-700">
            <strong>Please read carefully.</strong> Section 15 contains a{" "}
            <strong>binding arbitration agreement</strong> and a{" "}
            <strong>class action waiver</strong>. They affect how any dispute
            between us is resolved. You may opt out of arbitration within{" "}
            {ARBITRATION_OPT_OUT_DAYS} days — section 15.6 explains how. Sections
            12, 13 and 14 limit our liability to you.
          </p>
        </div>

        <H2>1. Who you are agreeing with</H2>
        <P>
          These Terms of Service (the &quot;Terms&quot;) are a binding agreement
          between you and <strong>{PROVIDER_LEGAL}</strong>, an individual sole
          proprietor (&quot;we,&quot; &quot;our,&quot; &quot;us&quot;) who
          operates the {SERVICE_NAME} mobile application and website (the
          &quot;Service&quot;). {SERVICE_NAME} is not currently an incorporated
          entity.
        </P>
        <P>
          By creating an account, or by accessing or using the Service, you
          agree to these Terms and to our{" "}
          <Link href="/privacy" className="text-blue-600 underline">
            Privacy Policy
          </Link>
          . If you do not agree, do not use the Service.
        </P>
        <P>
          We may assign these Terms, in whole, to any company we later form or
          to a successor that acquires the Service. Your agreement continues on
          the same terms with that entity, without any further action from you.
        </P>

        <H2>2. Eligibility</H2>
        <UL>
          <li>
            You must be at least {MIN_AGE} years old. We ask for your date of
            birth at sign-up and refuse accounts below this age.
          </li>
          <li>
            If you are between {MIN_AGE} and 17, you represent that your parent
            or legal guardian has read and agreed to these Terms on your behalf.
          </li>
          <li>
            You must not be barred from using the Service under the laws of your
            country, and you must not have been previously removed from the
            Service.
          </li>
        </UL>

        <H2>3. Your account</H2>
        <UL>
          <li>
            You sign in with your phone number. You are responsible for keeping
            access to that number and to your device secure.
          </li>
          <li>
            You are responsible for everything that happens under your account.
          </li>
          <li>
            The information you give us must be accurate. Impersonating someone
            else is not permitted.
          </li>
          <li>
            Tell us promptly at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600">
              {CONTACT_EMAIL}
            </a>{" "}
            if you believe your account has been compromised.
          </li>
        </UL>

        <H2>4. Content standards and zero tolerance for abuse</H2>
        <P>
          The Service lets people post video and photo content. We have{" "}
          <strong>no tolerance for objectionable content or abusive users</strong>
          . By using the Service you agree that you will not post, send, or
          share content that:
        </P>
        <UL>
          <li>
            sexually exploits or endangers a minor, or is sexual content
            involving anyone under 18 in any form;
          </li>
          <li>
            is pornographic, obscene, or sexually explicit;
          </li>
          <li>
            harasses, bullies, threatens, defames, or incites violence against
            anyone;
          </li>
          <li>
            promotes hatred or discrimination on the basis of race, ethnicity,
            national origin, religion, disability, sex, gender identity, age, or
            sexual orientation;
          </li>
          <li>
            depicts graphic violence, self-harm, or encourages suicide or eating
            disorders;
          </li>
          <li>
            promotes illegal activity, or the sale of drugs, weapons, or other
            regulated goods;
          </li>
          <li>
            infringes anyone&apos;s copyright, trademark, privacy, or publicity
            rights;
          </li>
          <li>
            shows a person in a private setting without their knowledge, or
            shares someone&apos;s private information without their permission;
          </li>
          <li>is spam, a scam, or deliberately deceptive.</li>
        </UL>

        <H3>Reporting, blocking, and our response</H3>
        <UL>
          <li>
            Every piece of content and every user in the app can be{" "}
            <strong>reported</strong> from within the app.
          </li>
          <li>
            You can <strong>block</strong> any user, which removes their content
            from your experience and prevents further contact.
          </li>
          <li>
            We review reports of objectionable content and act on them{" "}
            <strong>within 24 hours</strong>, removing content and, where
            warranted, permanently ejecting the user who posted it.
          </li>
          <li>
            You can also email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600">
              {CONTACT_EMAIL}
            </a>{" "}
            at any time.
          </li>
        </UL>
        <P>
          We may remove content or suspend accounts at our discretion, but we
          are not obliged to monitor content, and we do not pre-screen it. You
          may encounter content you find objectionable; you use the Service
          understanding that risk.
        </P>

        <H2>5. Your content and the licence you give us</H2>
        <P>
          <strong>You keep ownership of everything you post.</strong> We claim no
          ownership of your videos, photos, or other content.
        </P>
        <P>
          So that we can actually run the Service, you grant us a worldwide,
          non-exclusive, royalty-free, sublicensable licence to host, store,
          copy, reproduce, reformat, transcode, and display your content, and to
          submit it to automated systems — including third-party AI services —
          in order to generate your weekly recap. This licence exists only to
          operate, improve, and support the Service, and it ends when you delete
          the content or your account, except for the residual copies described
          in our{" "}
          <Link href="/privacy" className="text-blue-600 underline">
            Privacy Policy
          </Link>
          .
        </P>
        <P>
          We will not use your content in marketing or advertising without
          asking you first.
        </P>
        <P>You confirm that you have the rights to everything you post, and that:</P>
        <UL>
          <li>
            you have the permission of anyone identifiable who appears in it;
          </li>
          <li>
            posting it does not break the law or anyone else&apos;s rights.
          </li>
        </UL>

        <H2>6. Acceptable use</H2>
        <P>You agree not to:</P>
        <UL>
          <li>
            reverse engineer, decompile, scrape, or attempt to extract the
            source code of the Service;
          </li>
          <li>
            access the Service through automated means, or interfere with its
            operation or security;
          </li>
          <li>
            attempt to access accounts, data, or systems you are not authorised
            to;
          </li>
          <li>
            resell, rent, or commercially exploit the Service without our
            written permission;
          </li>
          <li>use the Service to break any applicable law.</li>
        </UL>

        <H2>7. Contacts and invitations</H2>
        <P>
          If you use the contacts feature, you confirm you have the right to
          check those numbers against our users. Invitations are composed and
          sent <strong>by you, from your own device and phone number</strong>,
          through your own messaging app. We do not send them for you.{" "}
          <strong>
            You are solely responsible for who you choose to contact and for
            complying with any laws that apply to messaging them.
          </strong>
        </P>

        <H2>8. Availability, changes, and your data</H2>
        <UL>
          <li>
            The Service is new and under active development. Features may
            change, break, or be withdrawn without notice.
          </li>
          <li>
            We do not guarantee any level of uptime, availability, or
            performance.
          </li>
          <li>
            <strong>
              We do not guarantee that your content will be retained, backed up,
              or recoverable.
            </strong>{" "}
            Content may be lost through bugs, outages, provider failure, or
            deletion. Keep your own copies of anything you cannot afford to
            lose.
          </li>
          <li>
            We may impose limits on storage, posting, or other usage at any
            time.
          </li>
        </UL>

        <H2>9. Third-party services</H2>
        <P>
          The Service depends on third parties, including Supabase, Amazon Web
          Services, Google, Expo, Apple, and Google Play. We are not responsible
          for their acts, omissions, outages, or terms. Your use of the Service
          is also subject to the terms of the app store you downloaded it from.
        </P>

        <H2>10. Copyright complaints</H2>
        <P>
          If you believe content on the Service infringes your copyright, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600">
            {CONTACT_EMAIL}
          </a>{" "}
          with: identification of the work, identification of the infringing
          material, your contact details, a statement that you believe in good
          faith the use is unauthorised, a statement under penalty of perjury
          that your notice is accurate and that you are authorised to act, and
          your signature. We remove infringing material and terminate repeat
          infringers.
        </P>

        <H2>11. Termination</H2>
        <P>
          You may stop using the Service and delete your account at any time
          from within the app. We may suspend or terminate your access at any
          time, with or without notice, for any reason, including breach of
          these Terms. Sections 5 (as to residual copies), 12, 13, 14, 15, 16
          and 17 survive termination.
        </P>

        <H2>12. Disclaimer of warranties</H2>
        <Caps>
          The service is provided &quot;as is&quot; and &quot;as available,&quot;
          with all faults and without warranty of any kind. To the maximum extent
          permitted by law, we disclaim all warranties, express, implied, or
          statutory, including any implied warranties of merchantability, fitness
          for a particular purpose, title, accuracy, and non-infringement. We do
          not warrant that the service will be uninterrupted, secure, timely, or
          error-free, that defects will be corrected, or that any content will be
          preserved, backed up, or recoverable.
        </Caps>

        <H2>13. Limitation of liability</H2>
        <Caps>
          To the maximum extent permitted by law, we will not be liable for any
          indirect, incidental, special, consequential, exemplary, or punitive
          damages, or for any loss of profits, revenue, data, content, goodwill,
          or other intangible losses, arising out of or relating to your use of
          or inability to use the service, any content posted by you or anyone
          else, or any conduct of any other user — whether based in contract,
          tort, negligence, strict liability, or otherwise, and even if we have
          been advised of the possibility of such damages.
        </Caps>
        <Caps>
          Our total aggregate liability to you for all claims relating to the
          service will not exceed the greater of (a) the total amount you have
          paid us in the twelve months before the event giving rise to the claim,
          or (b) {`US$${LIABILITY_CAP}`}.
        </Caps>
        <P>
          <strong>What this section does not cover.</strong> Nothing in these
          Terms excludes or limits our liability for death or personal injury
          caused by our negligence, for fraud or fraudulent misrepresentation,
          for gross negligence or wilful misconduct, or for anything else that
          cannot lawfully be excluded. If you are a consumer in the United
          Kingdom or Australia, you have statutory rights and guarantees that
          these Terms do not affect — in Australia, nothing here excludes,
          restricts, or modifies any guarantee under the Australian Consumer Law.
          Some jurisdictions do not allow the exclusion of certain warranties or
          liabilities, so parts of sections 12 and 13 may not apply to you.
        </P>

        <H2>14. Indemnification</H2>
        <P>
          You agree to defend, indemnify, and hold harmless {PROVIDER_LEGAL} and
          any future entity, successors, contractors, and agents from any claims,
          damages, losses, liabilities, and expenses (including reasonable legal
          fees) arising out of your content, your use of the Service, your
          violation of these Terms, or your violation of any law or the rights of
          any third party. This does not apply to the extent a claim arises from
          our own gross negligence or wilful misconduct.
        </P>

        <H2>15. Dispute resolution, arbitration, and class action waiver</H2>
        <P className="font-semibold">
          Please read this section carefully. It affects your legal rights,
          including your right to bring a lawsuit in court or participate in a
          class action.
        </P>

        <H3>15.1 Talk to us first</H3>
        <P>
          Before starting any formal proceeding, you agree to email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600">
            {CONTACT_EMAIL}
          </a>{" "}
          describing the dispute and what you want, and to give us{" "}
          <strong>30 days</strong> to resolve it informally. Most problems can be
          sorted out this way.
        </P>

        <H3>15.2 Binding individual arbitration</H3>
        <P>
          If we cannot resolve it, you and we agree that any dispute arising out
          of or relating to these Terms or the Service will be resolved by{" "}
          <strong>binding individual arbitration</strong> administered by the
          American Arbitration Association under its Consumer Arbitration Rules,
          rather than in court. Arbitration uses a neutral arbitrator instead of
          a judge or jury, allows more limited discovery, and is subject to
          limited review. The arbitrator&apos;s award is binding and may be
          entered as a judgment in any court of competent jurisdiction.
        </P>

        <H3>15.3 Class action and jury waiver</H3>
        <Caps>
          You and we agree that each may bring claims against the other only in
          an individual capacity, and not as a plaintiff or class member in any
          purported class, collective, consolidated, or representative
          proceeding. The arbitrator may not consolidate more than one
          person&apos;s claims. You and we waive any right to a jury trial.
        </Caps>

        <H3>15.4 Exceptions</H3>
        <P>
          Either of us may bring an individual claim in{" "}
          <strong>small claims court</strong> if it qualifies. Either of us may
          also seek injunctive relief in court for infringement or misuse of
          intellectual property rights.
        </P>

        <H3>15.5 Where and how</H3>
        <P>
          Arbitration will take place in {VENUE}, or by telephone or video, or
          based on written submissions, at your election. If the total claim is{" "}
          {`US$${LIABILITY_CAP * 100}`} or less, you may choose to have it
          resolved entirely on written submissions.
        </P>

        <H3>15.6 Your right to opt out</H3>
        <P>
          <strong>
            You may opt out of this arbitration agreement within{" "}
            {ARBITRATION_OPT_OUT_DAYS} days
          </strong>{" "}
          of first accepting these Terms by emailing{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600">
            {CONTACT_EMAIL}
          </a>{" "}
          with the subject line &quot;Arbitration Opt-Out&quot; and including
          your name and the phone number on your account. Opting out does not
          affect any other part of these Terms, and we will not treat you
          differently for doing so.
        </P>

        <H3>15.7 Severability of this section</H3>
        <P>
          If the class action waiver in 15.3 is found unenforceable as to a
          particular claim, that claim will proceed in court and all other claims
          remain in arbitration. If section 15 is found unenforceable in its
          entirety, disputes will be resolved in the courts identified in section
          16.
        </P>

        <H2>16. Governing law</H2>
        <P>
          These Terms are governed by the laws of the State of {GOVERNING_STATE},
          without regard to its conflict of law rules. Where a dispute is not
          subject to arbitration, you and we submit to the exclusive jurisdiction
          of the state and federal courts located in {VENUE}. If you are a
          consumer resident in the United Kingdom, Canada, or Australia, nothing
          in this section deprives you of the protection of mandatory consumer
          protection laws of your country of residence, or of the right to bring
          proceedings in your local courts where the law gives you that right.
        </P>

        <H2>17. Apple App Store</H2>
        <P>
          If you downloaded the app from the Apple App Store, the following
          applies:
        </P>
        <UL>
          <li>
            These Terms are between you and us only, not with Apple. Apple is not
            responsible for the app or its content.
          </li>
          <li>
            Apple has no obligation to provide any maintenance or support for the
            app.
          </li>
          <li>
            If the app fails to conform to any applicable warranty, you may
            notify Apple and Apple will refund the purchase price, if any. To the
            maximum extent permitted by law, Apple has no other warranty
            obligation whatsoever.
          </li>
          <li>
            Apple is not responsible for addressing any claim by you or a third
            party relating to the app, including product liability, regulatory
            non-compliance, or consumer protection claims.
          </li>
          <li>
            Apple is not responsible for investigating, defending, settling, or
            discharging any third-party claim that the app infringes
            intellectual property rights.
          </li>
          <li>
            You represent that you are not located in a country subject to a U.S.
            Government embargo or designated as a &quot;terrorist supporting&quot;
            country, and are not on any U.S. Government list of prohibited or
            restricted parties.
          </li>
          <li>
            Apple and its subsidiaries are third-party beneficiaries of these
            Terms and may enforce them against you.
          </li>
        </UL>

        <H2>18. General</H2>
        <UL>
          <li>
            <strong>Severability.</strong> If any provision is unenforceable, it
            is modified to the minimum extent necessary, or severed, and the rest
            remains in force.
          </li>
          <li>
            <strong>No waiver.</strong> Not enforcing a provision is not a waiver
            of it.
          </li>
          <li>
            <strong>Entire agreement.</strong> These Terms and the Privacy Policy
            are the whole agreement between us about the Service.
          </li>
          <li>
            <strong>Assignment.</strong> You may not assign these Terms. We may,
            as described in section 1.
          </li>
          <li>
            <strong>Force majeure.</strong> We are not liable for failures caused
            by events beyond our reasonable control.
          </li>
        </UL>

        <H2>19. Changes to these Terms</H2>
        <P>
          We may modify these Terms. If a change is material, we will update the
          date above and give notice in the app or by other reasonable means
          before it takes effect. Continuing to use the Service after that means
          you accept the revised Terms. If you do not accept them, stop using the
          Service and delete your account.
        </P>

        <p className="mt-12 text-gray-600">
          Questions about these Terms? Contact us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-blue-600 underline"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
      <Footer />
    </main>
  );
};

export default Terms;
