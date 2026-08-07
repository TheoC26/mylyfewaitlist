"use client";
import Footer from "@/components/Footer";
import {
  CONTACT_EMAIL,
  LAST_UPDATED,
  MIN_AGE,
  PROVIDER_LEGAL,
  SERVICE_NAME,
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

const Privacy = () => {
  return (
    <main className="bg-white text-black">
      <div className="mx-4 mt-4 width-full flex items-center justify-center mb-16">
        <Link href={"/"} className="text-xl font-bold text-center">
          MyLyfe
        </Link>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:py-8 mt-0 pb-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> {LAST_UPDATED}
        </p>

        <div className="bg-gray-50 border-l-4 border-gray-300 p-5 mb-8">
          <p className="font-semibold mb-3">The short version</p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700">
            <li>
              We sign you in with your phone number. We never ask for an email
              address for your account.
            </li>
            <li>
              Your videos are stored on our servers and shared with the friends
              you choose.
            </li>
            <li>
              To build your weekly recap, your videos are sent to Google&apos;s
              Gemini AI service for automated analysis.
            </li>
            <li>
              If you allow contacts access, we check your contacts&apos; phone
              numbers against our users to find friends. We do not store your
              address book.
            </li>
            <li>
              Location is off unless you turn it on. If you turn it on, we note
              the city a moment was recorded in — never a street address, only
              while you are recording, and never in the background.
            </li>
            <li>
              We do not sell your data, show you ads, or use any advertising or
              analytics trackers.
            </li>
            <li>
              Deleting your account deletes your videos and your profile from
              our systems.
            </li>
          </ul>
        </div>

        <H2>1. Who we are</H2>
        <P>
          {SERVICE_NAME} (the &quot;Service&quot;) is operated by{" "}
          <strong>{PROVIDER_LEGAL}</strong>, an individual sole proprietor
          located in the United States. {SERVICE_NAME} is not currently
          incorporated. References to &quot;we,&quot; &quot;our,&quot; and
          &quot;us&quot; in this policy mean that individual.
        </P>
        <P>
          You can reach us at any time at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-blue-600 font-medium"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </P>

        <H2>2. Information we collect</H2>

        <H3>a. Information you give us</H3>
        <UL>
          <li>
            <strong>Phone number.</strong> Used to create and sign in to your
            account. We send a one-time verification code by SMS. You also
            receive service messages related to your account.
          </li>
          <li>
            <strong>Name and username.</strong> Shown to your friends.
          </li>
          <li>
            <strong>Date of birth.</strong> Collected once, to confirm you meet
            our minimum age of {MIN_AGE}.
          </li>
          <li>
            <strong>Profile photo.</strong> Optional.
          </li>
          <li>
            <strong>Videos and photos you record,</strong> including their audio
            and any thumbnails generated from them, along with photo and emoji
            reactions you send to friends.
          </li>
        </UL>

        <H3>b. Your contacts — please read this one</H3>
        <P>
          If you grant contacts permission, the app reads phone numbers from
          your device&apos;s address book so it can tell you which of your
          contacts already use {SERVICE_NAME}. Specifically:
        </P>
        <UL>
          <li>
            Phone numbers from your address book are transmitted to our database
            purely to be compared against existing {SERVICE_NAME} accounts.
          </li>
          <li>
            <strong>
              We do not store your address book, and we do not keep the numbers
              of contacts who are not {SERVICE_NAME} users.
            </strong>{" "}
            Numbers that do not match an account are discarded once the check
            completes.
          </li>
          <li>
            Your contacts&apos; names never leave your device — they are only
            used to label the list you see.
          </li>
          <li>
            <strong>Invitations are sent by you, not by us.</strong> Choosing to
            invite someone opens your own Messages app with a message you can
            edit or cancel. We never send text messages on your behalf, and we
            never receive the phone number of anyone you invite.
          </li>
          <li>
            Contacts permission is entirely optional and can be revoked at any
            time in your device settings.
          </li>
        </UL>

        <H3>c. Location — only if you turn it on</H3>
        <P>
          Location is <strong>off by default</strong>. If you turn it on, we
          note roughly where a moment was recorded, so your weekly recap can say
          where the week actually happened. Specifically:
        </P>
        <UL>
          <li>
            <strong>What we collect is coarse.</strong> We record a city-level
            place name — for example &quot;Santa Monica, CA&quot; — and a
            coordinate rounded to three decimal places, which is roughly 110
            metres and deliberately too imprecise to identify a building. The
            rounding happens on your device before anything is sent to us.{" "}
            <strong>We never collect or store your street address.</strong>
          </li>
          <li>
            <strong>We only read it while you are recording.</strong> The app
            uses the foreground location permission only. We do not track you in
            the background, and we do not keep a location history beyond the
            single reading attached to each clip you post.
          </li>
          <li>
            For a video you import from your camera roll, we use the location
            your camera already saved in that video — never wherever you happen
            to be at the moment you import it.
          </li>
          <li>
            The <strong>city name</strong> is included in the automated analysis
            described in section 5, so your recap can refer to where you were.
            The coordinates are not sent to that service; they stay in our
            database.
          </li>
          <li>
            <strong>You can turn it off, and take it back.</strong> Location can
            be switched off at any time in the app&apos;s settings or in your
            device settings, which stops future clips carrying one. The app also
            has a <strong>Delete Location History</strong> option that erases the
            location saved on every clip you have already posted.
          </li>
        </UL>
        <P>
          Your time zone is a separate thing and is collected whether or not you
          enable location. A time zone spans a continent and tells us nothing
          about where you are; we use it only to work out which day and week a
          clip belongs to.
        </P>

        <H3>d. Information collected automatically</H3>
        <UL>
          <li>
            <strong>Push notification token,</strong> if you enable
            notifications, so we can deliver them.
          </li>
          <li>
            <strong>Device and app information:</strong> operating system, app
            version, and time zone (used to work out when your week ends).
          </li>
          <li>
            <strong>Basic usage data:</strong> such as your streak, how many
            clips you have posted this week, and when you last posted.
          </li>
          <li>
            <strong>Error and diagnostic logs</strong> when something goes
            wrong, which may include your account identifier and technical
            details of the failure.
          </li>
        </UL>

        <H3>e. Our website</H3>
        <P>
          If you join the waitlist on our website, we collect the email address
          you submit and store it in our database, and in a private Google
          Sheet. We use it to send you launch updates and, if you are one of the
          first 1,000 people to join, to invite you to add a short video to our
          homepage. You can unsubscribe from these emails at any time using the
          link at the bottom of any of them.
        </P>
        <P>
          If you accept that invitation and upload a video, we store the video
          you submit, a still frame taken from it, and a record of the
          permission you gave us — what you agreed to, and when. Uploaded videos
          are reviewed by a person before they appear anywhere. We show them
          publicly on our homepage only, and only because you explicitly agreed
          to that when you uploaded. Audio is removed during processing and is
          not retained.
        </P>
        <P>
          You can have your video taken down at any time by emailing us at{" "}
          {CONTACT_EMAIL}. Videos are deleted when you ask us to remove them,
          when we decline to publish them, or when we no longer need them.
        </P>

        <H2>3. What we do not collect</H2>
        <P>
          To be explicit, because policies of this kind often claim otherwise by
          default:
        </P>
        <UL>
          <li>We do not collect an email address for your app account.</li>
          <li>
            We do not collect your exact or street-level location, we do not
            collect location in the background, and we do not track your
            movements. The optional feature described in section 2(c) is
            city-level, read only while you are recording, and off unless you
            turn it on.
          </li>
          <li>
            We do not use advertising identifiers, ad networks, or third-party
            analytics or tracking SDKs in the app.
          </li>
          <li>
            We do not use cookies, web beacons, or pixels for tracking or
            advertising.
          </li>
          <li>
            We do not perform facial recognition and do not collect biometric
            identifiers.
          </li>
          <li>
            We do not sell your personal information, and we do not share it for
            cross-context behavioural advertising.
          </li>
        </UL>

        <H2>4. How we use your information</H2>
        <UL>
          <li>To create your account and sign you in.</li>
          <li>
            To store your videos and deliver them to the friends you share them
            with.
          </li>
          <li>
            To generate your weekly recap, including the automated analysis
            described in section 5.
          </li>
          <li>
            To send notifications you have opted into, such as when a friend
            posts or when your weekly recap is ready.
          </li>
          <li>To help you find friends, if you enable contacts.</li>
          <li>
            To give your recap a sense of place, if you enable location — for
            example, so it can name the city a week was spent in.
          </li>
          <li>
            To keep the Service working, diagnose problems, and prevent abuse.
          </li>
          <li>To respond to reports of objectionable content or conduct.</li>
          <li>To comply with the law.</li>
        </UL>

        <H2>5. Third-party services we use</H2>
        <P>
          We use the following providers to run the Service. They process your
          information on our behalf and are not permitted to use it for their
          own purposes, except as described in their own terms.
        </P>
        <UL>
          <li>
            <strong>Supabase</strong> — accounts, authentication, and database.
            Also delivers your SMS verification codes through its telephony
            providers.
          </li>
          <li>
            <strong>Amazon Web Services (S3)</strong> — storage of videos,
            thumbnails, photo reactions, and profile photos, in the United
            States.
          </li>
          <li>
            <strong>Google (Gemini API)</strong> — see the callout below.
          </li>
          <li>
            <strong>Expo</strong> — delivery of push notifications.
          </li>
          <li>
            <strong>Vercel</strong> — hosting for our website.
          </li>
          <li>
            <strong>Google Sheets</strong> — storage of website waitlist emails.
          </li>
          <li>
            <strong>Resend</strong> — delivery of our waitlist and launch
            emails.
          </li>
        </UL>

        <div className="bg-gray-50 border-l-4 border-gray-400 p-5 mb-4">
          <p className="font-semibold mb-2">
            Automated analysis of your videos
          </p>
          <p className="text-sm text-gray-700">
            To assemble your weekly recap, the video you record is transmitted
            to <strong>Google&apos;s Gemini API</strong>, which analyses its
            content automatically in order to select and arrange moments. This
            means your video content is processed by Google as part of providing
            this feature. If you have enabled location, the city-level place
            name attached to a clip is sent along with it so the recap can
            mention where you were; the coordinates are not.
            Google&apos;s handling of that data is governed by its
            own API terms and privacy commitments. This processing is automated;
            no human at {SERVICE_NAME} reviews your videos as part of it. If you
            are not comfortable with this, please do not post videos to the
            Service.
          </p>
        </div>

        <P>
          We may also disclose information where we are legally required to, for
          example in response to a valid subpoena, court order, or lawful
          request from a government authority; where necessary to investigate
          fraud, abuse, or a threat to someone&apos;s safety; or, if the Service
          is ever sold or transferred, to the acquiring party, who would remain
          bound by the commitments in this policy.
        </P>

        <H2>6. What other people can see</H2>
        <UL>
          <li>
            Friends you have connected with can see your name, username, profile
            photo, streak, the clips you post, and your weekly recap.
          </li>
          <li>
            Reactions you send are shown to the person whose content you reacted
            to, attributed to you.
          </li>
          <li>
            Your weekly recap may appear alongside your friends&apos; in a
            shared Monday recap.
          </li>
          <li>
            If you enable location, the city a clip was recorded in may be
            mentioned in the recap your friends see — for instance, a recap that
            refers to a weekend in another city. Only the city is ever used this
            way, never an address, and never the underlying coordinates.
          </li>
          <li>
            You can block or report another user from within the app at any
            time.
          </li>
        </UL>

        <H2>7. How long we keep things, and deleting your account</H2>
        <P>
          You can delete your account at any time from within the app. When you
          do, we delete:
        </P>
        <UL>
          <li>
            your profile, including your name, username, and phone number;
          </li>
          <li>
            your video clips and their thumbnails, including any capture
            location stored on them;
          </li>
          <li>your weekly recaps;</li>
          <li>your reactions, including any photo reactions you sent;</li>
          <li>your profile photo;</li>
          <li>your friend connections.</li>
        </UL>
        <P>
          These are removed from both our database and our file storage. To be
          straightforward about the limits of that:
        </P>
        <UL>
          <li>
            A friend&apos;s weekly recap that was already generated before you
            deleted your account may still contain a clip of yours that was
            compiled into it.
          </li>
          <li>
            Residual copies may persist in encrypted backups and server logs for
            a short period before being overwritten in the ordinary course.
          </li>
          <li>
            We may retain records relating to reports of objectionable content,
            safety issues, or legal claims for as long as necessary to handle
            them.
          </li>
          <li>
            Capture locations are kept for as long as the clip they belong to,
            unless you erase them sooner with Delete Location History. A recap
            that was already written may still refer to a city in its text after
            you clear it.
          </li>
          <li>Waitlist emails are kept until you ask us to remove them.</li>
          <li>
            Videos submitted for our homepage are kept until you ask us to
            remove them, or until we no longer need them. The record of the
            permission you gave us is kept for as long as we use the video, so
            we can show what was agreed.
          </li>
        </UL>

        <H2>8. Security</H2>
        <P>
          Data is transmitted over encrypted connections and stored with
          established providers using access controls. That said, no method of
          transmission or storage is completely secure, and we cannot guarantee
          absolute security. If a breach affecting your personal information
          occurs, we will notify you and any regulators where the law requires
          it.
        </P>

        <H2>9. Children</H2>
        <P>
          The Service is not intended for anyone under {MIN_AGE}. We ask for
          your date of birth during sign-up and block accounts below that age.
          We do not knowingly collect personal information from children under{" "}
          {MIN_AGE}, and if we learn that we have, we will delete the account
          and its content promptly.
        </P>
        <P>
          If you are a parent or guardian and believe your child has provided us
          with information, contact us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-blue-600 font-medium"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          and we will remove it.
        </P>

        <H2>10. Your rights</H2>
        <P>
          Wherever you live, you can access, correct, or delete your information
          — most of it directly in the app, and the rest by emailing us. We will
          not treat you differently for exercising any of these rights.
        </P>

        <H3>California residents (CCPA / CPRA)</H3>
        <P>
          In the past twelve months we have collected the categories of personal
          information described in section 2: identifiers (phone number, name,
          username, account ID), age, audio and visual information (your videos
          and photos), internet or device activity (app usage and diagnostics),
          and — only from users who have turned it on — coarse, city-level
          geolocation. The purposes are set out in section 4 and the recipients
          in section 5.
        </P>
        <P>
          <strong>
            We have not sold personal information, and we have not shared it for
            cross-context behavioural advertising, in the past twelve months.
          </strong>{" "}
          We do not knowingly sell or share the personal information of anyone
          under 16. You have the right to know, delete, and correct your
          information, and to be free from discrimination for exercising those
          rights. An authorised agent may submit a request on your behalf with
          proof of authorisation.
        </P>
        <P>
          <strong>Geolocation.</strong> If you enable location, the coordinate
          we store may qualify as precise geolocation, and therefore as
          sensitive personal information, under California law. We collect it
          only from users who have turned the feature on, and we use it only to
          provide the recap feature described in this policy — never to infer
          characteristics about you, and never for advertising. That is the
          limited set of purposes permitted without a further right to limit its
          use, but you may switch the feature off and erase what we have saved
          at any time, as described in section 2(c).
        </P>

        <H3>United Kingdom (UK GDPR)</H3>
        <P>
          Our legal bases for processing are:{" "}
          <strong>performance of a contract</strong> (running your account and
          delivering the Service), <strong>consent</strong> (contacts access,
          location, push notifications — each withdrawable at any time),{" "}
          <strong>legitimate interests</strong> (keeping the Service secure and
          preventing abuse), and <strong>legal obligation</strong> where
          applicable.
        </P>
        <P>
          You have the right to access, rectify, erase, restrict, and object to
          processing, and the right to data portability. You may lodge a
          complaint with the Information Commissioner&apos;s Office at{" "}
          <a
            href="https://ico.org.uk"
            className="text-blue-600 font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            ico.org.uk
          </a>
          .
        </P>

        <H3>Canada (PIPEDA)</H3>
        <P>
          You may request access to the personal information we hold about you
          and ask for corrections. Complaints may be directed to the Office of
          the Privacy Commissioner of Canada.
        </P>

        <H3>Australia (Privacy Act / APPs)</H3>
        <P>
          You may request access to and correction of your personal information.
          Complaints may be directed to us first and then, if unresolved, to the
          Office of the Australian Information Commissioner.
        </P>

        <H2>11. Where your information is held</H2>
        <P>
          The Service is operated from the United States, and your information —
          including your videos — is stored and processed there by the providers
          listed in section 5. If you are located in the United Kingdom, Canada,
          Australia, or elsewhere outside the United States, using the Service
          involves transferring your information to the United States, where
          privacy laws differ from those in your own country.
        </P>

        <H2>12. Changes to this policy</H2>
        <P>
          We may update this policy as the Service changes. If we make a
          material change, we will update the date at the top and, where the
          change significantly affects how we handle your information, give
          notice in the app. Continuing to use the Service after a change means
          you accept the updated policy.
        </P>

        <H2>13. Contact</H2>
        <P>
          Questions, requests, or complaints about this policy or your data:
          <br />
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-blue-600 font-medium"
          >
            {CONTACT_EMAIL}
          </a>
        </P>
      </div>
      <Footer />
    </main>
  );
};

export default Privacy;
