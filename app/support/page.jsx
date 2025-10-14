"use client";
import FAQs from "@/components/FAQs";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Support = () => {
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
      <div
        className="mx-4 mt-4 width-full flex itmes-center justify-center mb-16"
        href={"/"}
      >
        <Link href={"/"} className="text-xl font-bold text-center">
          MyLyfe
        </Link>
      </div>

      {/* about page */}
      <section className=" max-w-5xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-5">Support</h1>
        <p className="text-lg mb-16">
          If you have any questions or need help, please contact us at
          theo.htf.chan@gmail.com
        </p>
      </section>
      <FAQs faqs={faqs} />
      <Footer />
    </main>
  );
};

export default Support;
