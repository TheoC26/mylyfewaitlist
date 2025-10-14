import React, { useState } from "react";

const FAQs = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Frequently asked questions
        </h2>
        <dl className="mt-6 space-y-3 divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <div key={index} className="pt-6">
              <dt>
                <button
                  className="text-left w-full flex justify-between items-start text-gray-400"
                  onClick={() => handleToggle(index)}
                  aria-expanded={openIndex === index}
                >
                  <span className="font-medium text-gray-900">
                    {faq.question}
                  </span>
                  <span className="ml-6 h-7 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                      className={`h-6 w-6 transition-transform ${
                        openIndex === index ? "transform rotate-180" : ""
                      }`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v12m6-6H6"
                      ></path>
                    </svg>
                  </span>
                </button>
              </dt>
              <dd
                className={`my-2 mb-6 text-base text-gray-500 transition-opacity ${
                  openIndex === index ? "opacity-100" : "opacity-0 h-0"
                }`}
              >
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default FAQs;
