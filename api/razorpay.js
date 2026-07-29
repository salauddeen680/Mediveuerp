const Razorpay = require('razorpay');

export default async function handler(req, res) {
  // CORS Setup: Frontend ko backend se connect hone dene ke permission
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Pre-flight request check
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Sirf POST request allow karenge (jisme amount aayega)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    // Razorpay system ko start karna (Keys Vercel ke environment variables se aayengi)
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID, 
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Order create karne ki settings
    const options = {
      amount: amount * 100, // Razorpay paise mein kaam karta hai (e.g., 249 * 100 = 24900)
      currency: 'INR',
      receipt: `receipt_${Math.floor(Math.random() * 1000000)}`, // Random receipt id
    };

    // Razorpay se naya order ID mangwana
    const order = await razorpay.orders.create(options);

    // Frontend (SubscriptionPlans.jsx) ko order return karna
    res.status(200).json(order);
    
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
}

