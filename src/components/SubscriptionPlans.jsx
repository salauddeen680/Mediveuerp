import React from 'react';
// Agar aap react-router-dom use kar rahe hain toh use navigate ke liye import karein
// import { useNavigate } from 'react-router-dom';

const SubscriptionPlans = () => {
  // const navigate = useNavigate();

  const handleSubscribe = async (planName, price) => {
    // Yahan aap check karenge ki user logged in hai ya nahi
    // Agar logged in nahi hai, toh: navigate('/login');

    if (price === 0) {
      console.log("7-Day Free Trial Activated!");
      // Yahan Firebase Database mein user ka planEndDate +7 days update karne ka logic aayega
      alert("Aapka 7-Day Free Trial shuru ho gaya hai!");
    } else {
      console.log(`Initiating Payment for ${planName} Plan - ₹${price}`);
      // YAHAN AAP APNI ALAG SE BANAYI GAYI API CALL KARENGE
      // Example: const order = await createRazorpayOrder(price);
      alert(`Razorpay popup will open for ₹${price}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Simple, Transparent Pricing
        </h2>
        <p className="mt-4 text-lg text-gray-500">
          Apne business ko grow karne ke liye best plan choose karein. No hidden fees.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-3 lg:gap-12">
        
        {/* 1. Free Trial Plan */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">Starter</h3>
            <p className="mt-4 flex items-baseline text-5xl font-extrabold text-gray-900">
              ₹0
              <span className="ml-1 text-xl font-medium text-gray-500">/7 Days</span>
            </p>
            <p className="mt-6 text-gray-500">Naye users ke liye perfect trial.</p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span> Full ERP Access
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span> Basic Support
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe('Trial', 0)}
            className="mt-8 block w-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold py-3 px-4 rounded-lg text-center transition"
          >
            Start Free Trial
          </button>
        </div>

        {/* 2. Monthly Plan */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 p-8 flex flex-col justify-between relative transform scale-105">
          <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Most Popular
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">Monthly</h3>
            <p className="mt-4 flex items-baseline text-5xl font-extrabold text-gray-900">
              ₹249
              <span className="ml-1 text-xl font-medium text-gray-500">/mo</span>
            </p>
            <p className="mt-6 text-gray-500">Growing businesses ke liye best.</p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span> All Trial Features
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span> Premium Support
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span> Unlimited Billing
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe('Monthly', 249)}
            className="mt-8 block w-full bg-blue-600 text-white hover:bg-blue-700 font-bold py-3 px-4 rounded-lg text-center transition"
          >
            Subscribe Monthly
          </button>
        </div>

        {/* 3. Yearly Plan */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">Yearly</h3>
            <p className="mt-4 flex items-baseline text-5xl font-extrabold text-gray-900">
              ₹2799
              <span className="ml-1 text-xl font-medium text-gray-500">/yr</span>
            </p>
            <p className="mt-6 text-gray-500">Long-term savings (Save ₹189).</p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span> All Monthly Features
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span> Priority 24/7 Support
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span> Advanced Reports
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe('Yearly', 2799)}
            className="mt-8 block w-full bg-gray-800 text-white hover:bg-gray-900 font-bold py-3 px-4 rounded-lg text-center transition"
          >
            Subscribe Yearly
          </button>
        </div>

      </div>
    </div>
  );
};

export default SubscriptionPlans;

