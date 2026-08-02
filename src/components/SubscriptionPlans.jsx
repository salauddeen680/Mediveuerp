import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function SubscriptionPlans({ user, showToast, navigate }) {
  const [loading, setLoading] = useState(false);

  // Razorpay Checkout script load karne ke liye
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleSubscribe = async (planName, price) => {
    if (!user) {
      alert("Please login first to subscribe!");
      if (navigate) navigate('public', 'login');
      return;
    }

    try {
      setLoading(true);

      // 1. Agar Free Trial hai
      if (price === 0) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          plan: '7 Days Free Trial',
          status: 'Active',
          updatedAt: serverTimestamp()
        });
        if (showToast) showToast('7-Day Free Trial Activated Successfully!');
        else alert("7-Day Free Trial Activated Successfully!");
        if (navigate) navigate('app', 'pos');
        return;
      }

      // 2. Paid Plans ke liye Backend (api/razorpay.js) ko call karna
      if (showToast) showToast(`Initiating payment for ${planName}...`);
      
      const response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: price }),
      });

      const order = await response.json();

      if (!order.id) {
        throw new Error(order.message || 'Failed to create payment order');
      }

      // 3. Razorpay Popup Configuration
      const options = {
        // VITE FIX: Yahan apni asli Live Key zaroor daalein!
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_YAHAN_APNI_ASLI_LIVE_KEY_DAALEIN', 
        amount: order.amount,
        currency: order.currency,
        name: 'Mediveu ERP',
        description: `Subscription for ${planName}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // Payment successful hone par Firebase mein plan update karna
            const userRef = doc(db, 'users', user.uid);
            const planFullName = planName === 'Monthly' ? 'Monthly Plan (₹249)' : 'Yearly Plan (₹2799)';
            
            await updateDoc(userRef, {
              plan: planFullName,
              status: 'Active',
              razorpayPaymentId: response.razorpay_payment_id,
              updatedAt: serverTimestamp()
            });

            if (showToast) showToast('Payment Successful! Plan Activated.');
            else alert('Payment Successful! Plan Activated.');
            
            // POS screen par redirect karna
            if (navigate) navigate('app', 'pos');
            else window.location.reload();

          } catch (err) {
            console.error("Firebase Update Error:", err);
            alert("Payment was successful, but failed to update plan in database. Please contact support.");
          }
        },
        prefill: {
          email: user.email || '',
        },
        theme: {
          color: '#2563eb',
        },
      };

      const paymentWindow = new window.Razorpay(options);
      paymentWindow.open();

    } catch (error) {
      console.error("Subscription Error:", error);
      alert("Error: " + (error.message || 'Something went wrong during payment setup.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 text-gray-100 font-sans">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Simple, Transparent Pricing
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          Apne business ko grow karne ke liye best plan choose karein. No hidden fees.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-3 lg:gap-12">
        
        {/* 1. Free Trial Plan */}
        <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Starter</h3>
            <p className="mt-4 flex items-baseline text-5xl font-extrabold text-white">
              ₹0
              <span className="ml-1 text-xl font-medium text-gray-400">/7 Days</span>
            </p>
            <p className="mt-6 text-gray-400">Naye users ke liye perfect trial.</p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span> Full ERP Access
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span> Basic Support
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe('Trial', 0)}
            disabled={loading}
            className="mt-8 block w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 font-bold py-3 px-4 rounded-lg text-center transition cursor-pointer"
          >
            Start Free Trial
          </button>
        </div>

        {/* 2. Monthly Plan */}
        <div className="bg-gray-900 rounded-2xl shadow-xl border-2 border-blue-500 p-8 flex flex-col justify-between relative transform lg:scale-105">
          <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Most Popular
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white">Monthly</h3>
            <p className="mt-4 flex items-baseline text-5xl font-extrabold text-white">
              ₹249
              <span className="ml-1 text-xl font-medium text-gray-400">/mo</span>
            </p>
            <p className="mt-6 text-gray-400">Growing businesses ke liye best.</p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span> All Trial Features
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span> Premium Support
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span> Unlimited Billing
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe('Monthly', 249)}
            disabled={loading}
            className="mt-8 block w-full bg-blue-600 text-white hover:bg-blue-700 font-bold py-3 px-4 rounded-lg text-center transition cursor-pointer shadow-lg shadow-blue-500/30"
          >
            {loading ? 'Processing...' : 'Subscribe Monthly'}
          </button>
        </div>

        {/* 3. Yearly Plan */}
        <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Yearly</h3>
            <p className="mt-4 flex items-baseline text-5xl font-extrabold text-white">
              ₹2799
              <span className="ml-1 text-xl font-medium text-gray-400">/yr</span>
            </p>
            <p className="mt-6 text-gray-400">Long-term savings (Save ₹189).</p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span> All Monthly Features
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span> Priority 24/7 Support
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span> Advanced Reports
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe('Yearly', 2799)}
            disabled={loading}
            className="mt-8 block w-full bg-indigo-600 text-white hover:bg-indigo-700 font-bold py-3 px-4 rounded-lg text-center transition cursor-pointer"
          >
            {loading ? 'Processing...' : 'Subscribe Yearly'}
          </button>
        </div>

      </div>
    </div>
  );
}
