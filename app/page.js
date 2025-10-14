'use client';

import { useState } from 'react';
import Footer from "@/components/Footer";
import Image from "next/image";

export default function Home() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!email) {
      setMessage('Email is required.');
      return;
    }

    try {
      const res = await fetch('/api/add_to_waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Successfully joined the waitlist!');
        setEmail('');
      } else {
        setMessage(data.message || 'Something went wrong.');
      }
    } catch (error) {
      setMessage('Something went wrong.');
      console.error(error);
    }
  };

  return (
    <>
      <main className="bg-white">
        <div className="top-0 left-0 mx-4 mt-16">
          {/* <Image
            src="/MnemoLogoNoText.png"
            alt="Mnemo Logo"
            width={1000} // Set width of the logo
            height={1000} // Set height of the logo
            className="w-16 h-16" // Optional Tailwind CSS classes for styling
          /> */}
        </div>
        <div className="relative overflow-hidden">
          <div className="bg-white pb-14 lg:overflow-hidden">
            <div className="mx-auto max-w-6xl lg:px-8">
              <div className="lg:grid lg:grid-cols-2 lg:gap-8">
                <div className="mx-auto max-w-md px-4 text-center sm:max-w-2xl sm:px-6 lg:flex lg:items-center lg:px-0 lg:text-left">
                  <div className="lg:py-24">
                    <h1 className="mt-4 text-4xl font-bold tracking-tight text-black sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl">
                      <span className="block text-white font-outline-2">
                        Introducing{" "}
                      </span>
                      <span className="block text-black">MyLyfe</span>
                    </h1>
                    <p className="mt-3 text-base text-gray-400 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                      The new wave of social media starts here. Join our mailing
                      list to be one of the first to try it out.
                    </p>
                    <div className="mt-10 sm:mt-12">
                      <form
                        className="sm:mx-auto sm:max-w-xl lg:mx-0"
                        onSubmit={handleSubmit}
                      >
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
                              autoComplete="off"
                              required
                            />
                          </div>
                          <div className="mt-3 sm:mt-0 sm:ml-3">
                            <button
                              type="submit"
                              className="block w-full rounded-md outline-1 outline-[#D7D7D7] bg-[url('/BG.png')] bg-cover py-3 px-4 text-black cursor-pointer text-sm font-semibold transition-all shadow hover:opacity-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-gray-900"
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      </form>
                      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
                    </div>
                    {/* button for apple store */}
                    {/* <div className="mt-3">
                      <a
                        href="https://apps.apple.com/us/app/mnemo-remember/id6680171876"
                        className="block w-full rounded-md bg-[#a796cc] py-3 px-4 font-medium text-white transition-all shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        Download on the App Store
                      </a>
                    </div> */}
                  </div>
                </div>
                <div className="mt-12 lg:hidden">
                  <Image
                    src="/mylyfe-product.png"
                    alt="Product preview"
                    width={600}
                    height={600}
                    className="w-72 sm:w-80 h-auto mx-auto"
                    priority
                  />
                </div>
                <div className="mt-12 hidden lg:flex justify-center w-full items-center">
                  <Image
                    className="w-4/7 mx-auto"
                    width={1000} // Set width of the logo
                    height={1000} // Set height of the logo
                    src="/mylyfe-product.png"
                    alt="Placeholder image"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
