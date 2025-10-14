"use client";
import FAQs from "@/components/FAQs";
import Footer from "@/components/Footer";
import Link from "next/link";
import React from "react";

const About = () => {
  const faqs = [
    {
      question: "What is My Lyfe?",
      answer:
        "My Lyfe is a new kind of social app that helps people stay connected through real, personal moments. Instead of likes and scrolling, users record short video diaries that are turned into meaningful weekly montages.",
    },
    {
      question: "How does My Lyfe work?",
      answer:
        "At the end of each week, My Lyfe reminds you to record your final clip by saying “and that’s my Lyfe.” Then, it compiles your short videos into a simple, authentic montage you can keep private, share with close friends, or post publicly.",
    },
    {
      question: "Who is My Lyfe for?",
      answer:
        "My Lyfe is for anyone who wants to feel more connected without the pressure of traditional social media — from college students and families to long-distance friends and couples.",
    },
    {
      question: "Is My Lyfe powered by AI?",
      answer:
        "Yes — My Lyfe uses smart editing tools to automatically organize and highlight your week’s most meaningful moments. But at its core, My Lyfe isn’t about technology — it’s about people and genuine connection.",
    },
  ];

  return (
    <main>
      <div className="mx-4 mt-4 width-full flex items-center justify-center mb-16">
        <Link href={"/"} className="text-xl font-bold text-center">
          My Lyfe
        </Link>
      </div>

      {/* about page */}
      <section className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-5">About Us</h1>
        <p className="text-lg mb-16">
          My Lyfe was built to make digital connection more human. We’re
          redefining what it means to stay in touch — not through likes or
          scrolling, but through short, genuine moments that tell the story of
          your week. My Lyfe makes it easy to capture and share your real life
          with the people who matter most, without the noise or pressure of
          traditional social media.
        </p>

        <h1 className="text-3xl font-bold mb-5">What is My Lyfe?</h1>
        <p className="text-lg mb-16">
          My Lyfe is a personal video diary app that turns your everyday moments
          into a simple, meaningful weekly story. Each week, users record short
          clips — from small joys to big milestones — and end with one line:
          <span className="italic"> “and that’s my Lyfe.” </span> My Lyfe then
          compiles these clips into a short montage you can keep private, share
          with close friends and family, or post publicly. It’s a space to be
          authentic, stay connected, and reflect on your life — without
          algorithms, likes, or performative content.
        </p>

        <h1 className="text-3xl font-bold mb-5">How does My Lyfe work?</h1>
        <p className="text-lg mb-16">
          Every week, you’ll get a gentle reminder to capture your “My Lyfe”
          moment. After you record your closing clip, My Lyfe helps you upload
          your weekly videos and automatically creates your life montage. You
          can choose to edit it, share it, or simply keep it for yourself. Using
          built-in smart editing technology, the app highlights your most
          meaningful moments — not based on popularity, but on emotion and
          presence.
        </p>

        <h1 className="text-3xl font-bold mb-5">Behind My Lyfe</h1>
        <p className="text-lg mb-16">
          My Lyfe was created by a group of young developers and designers who
          wanted to make connection online feel more personal again. Our team
          believes that technology should bring people closer — not make them
          perform. We’re building My Lyfe to help you document your journey,
          share your story, and stay present in the lives of those you love.
        </p>

        <FAQs faqs={faqs} />
      </section>
      <Footer />
    </main>
  );
};

export default About;
