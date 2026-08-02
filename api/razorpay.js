const Razorpay = require('razorpay');

module.exports = async function handler(req, res) {
  // CORS Headers - Frontend ko block hone se bachane ke liye
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request handle karna
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Sirf POST request allow karna
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    // Body ko parse karna (agar frontend se string format mein aaya ho)
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { amount } = body;

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    // Live Keys environment variables se lena
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID, 
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // Amount hamesha paise mein hona chahiye (Math.round decimal error se bachata hai)
      currency: 'INR',
      receipt: `receipt_${Math.floor(Math.random() * 1000000)}`,
    };

    const order = await razorpay.orders.create(options);
    
    // Success hone par order frontend ko bhejna
    return res.status(200).json(order);
    
  } catch (error) {
    console.error("Razorpay Error Backend:", error);
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
}
