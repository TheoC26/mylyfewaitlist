"use client";
import FAQs from "@/components/FAQs";
import Footer from "@/components/Footer";
import Link from "next/link";
import React from "react";

const About = () => {
  const faqs = [
    {
      question: "What is MyLyfe?",
      answer:
        "MyLyfe is a new kind of social app that helps people stay connected through real, personal moments. Instead of likes and scrolling, users record short video diaries that are turned into meaningful weekly montages.",
    },
    {
      question: "How does MyLyfe work?",
      answer:
        "At the end of each week, MyLyfe reminds you to record your final clip by saying “and that’s MyLyfe.” Then, it compiles your short videos into a simple, authentic montage you can keep private, share with close friends, or post publicly.",
    },
    {
      question: "Who is MyLyfe for?",
      answer:
        "MyLyfe is for anyone who wants to feel more connected without the pressure of traditional social media — from college students and families to long-distance friends and couples.",
    },
    {
      question: "Is MyLyfe powered by AI?",
      answer:
        "Yes — MyLyfe uses smart editing tools to automatically organize and highlight your week’s most meaningful moments. But at its core, MyLyfe isn’t about technology — it’s about people and genuine connection.",
    },
  ];

  return (
    <main>
      <div className="mx-4 mt-4 width-full flex items-center justify-center mb-16">
        <Link href={"/"} className="text-xl font-bold text-center">
          MyLyfe
        </Link>
      </div>

      {/* about page */}
      <section className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-5">About Us</h1>
        <p className="text-lg mb-16">
          MyLyfe was built to make digital connection more human. We’re
          redefining what it means to stay in touchm through short, genuine moments that tell the story of
          your week. MyLyfe makes it easy to capture and share your real life
          with the people who matter most, without the noise or pressure of
          traditional social media.
        </p>

        <h1 className="text-3xl font-bold mb-5">What is MyLyfe?</h1>
        <p className="text-lg mb-16">
          MyLyfe is a personal video diary app that turns your everyday moments
          into a simple, meaningful weekly story. Each week, users record short
          clips, from small joys to big milestones. MyLyfe then
          compiles these clips into a short montage you can keep private, share
          with close friends and family, or post publicly. It’s a space to be
          authentic, stay connected, and reflect on your life — without
          algorithms, likes, or performative content.
        </p>

        <h1 className="text-3xl font-bold mb-5">Behind MyLyfe</h1>
        <p className="text-lg mb-16">
          MyLyfe was created by a group of young developers and designers who
          wanted to make connection online feel more personal again. Our team
          believes that technology should bring people closer — not make them
          perform. We’re building MyLyfe to help you document your journey,
          share your story, and stay present in the lives of those you love.
        </p>

        <FAQs faqs={faqs} />
      </section>
      <Footer />
    </main>
  );
};

export default About;
