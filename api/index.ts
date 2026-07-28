import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';

const app = express();

// --- SECURITY: Restrict CORS to allowed origins only ---
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin, or matches localhost, or matches vercel.app
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Email transporter (Lazy initialization)
let transporter: any = null;
const getTransporter = () => {
  if (!transporter) {
    if (!process.env.ADMIN_EMAIL_USER || !process.env.ADMIN_EMAIL_PASS) {
      return null;
    }
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.ADMIN_EMAIL_USER,
        pass: process.env.ADMIN_EMAIL_PASS,
      },
    });
  }
  return transporter;
};

// Notify Admin
app.post('/api/notify-admin', async (req, res) => {
  const { booking, adminEmail } = req.body;

  if (!booking || !adminEmail) {
    return res.status(400).json({ error: 'Missing booking or adminEmail' });
  }

  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    console.warn('Email credentials not set. Skipping email notification.');
    return res.status(200).json({ message: 'Email credentials not set. Notification skipped on server.' });
  }

  const mailOptions = {
    from: `"Atomic Solutions Notification" <${process.env.ADMIN_EMAIL_USER}>`,
    to: adminEmail,
    subject: `New Booking Request: ${booking.serviceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: #0A192F; color: #64FFDA; padding: 20px; text-align: center;">
          <h1 style="margin: 0; text-transform: uppercase; letter-spacing: 2px;">New Request</h1>
        </div>
        <div style="padding: 30px; color: #333;">
          <h2 style="color: #0A192F; margin-top: 0;">Booking Details</h2>
          <p><strong>Service:</strong> ${booking.serviceName}</p>
          <p><strong>Package:</strong> ${booking.tier}</p>
          <p><strong>Estimated Price:</strong> ₹${booking.price}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <h2 style="color: #0A192F;">Customer Info</h2>
          <p><strong>Name:</strong> ${booking.userName}</p>
          <p><strong>Phone:</strong> ${booking.userPhone}</p>
          <p><strong>WhatsApp:</strong> ${booking.whatsappNumber || 'N/A'}</p>
          <p><strong>Address:</strong> ${booking.userAddress}</p>
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://${req.get('host')}/admin" style="background: #64FFDA; color: #0A192F; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block;">View in Dashboard</a>
          </div>
        </div>
        <div style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888;">
          Sent by Atomic Solutions Automated System
        </div>
      </div>
    `,
  };

  try {
    await mailTransporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error sending email:', error);
    if (error.code === 'EAUTH' || error.message.includes('535')) {
      console.error('CRITICAL: Gmail Authentication Failed. Please ensure you are using a "Gmail App Password" (16 characters) and NOT your regular Google password.');
    }
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message.includes('535') ? 'Authentication failed. Please check your App Password.' : 'Internal Server Error'
    });
  }
});

// Razorpay
app.post('/api/create-razorpay-order', async (req, res) => {
  let razorpay: any = null;
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  
  if (!razorpay) {
    return res.status(503).json({ error: 'Payment service not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.' });
  }
  try {
    const { amount, receipt } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Gemini AI Proxy
app.post('/api/chat', async (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return res.status(503).json({ error: 'AI service not configured. Set GEMINI_API_KEY environment variable.' });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || 'AI request failed';
      return res.status(response.status).json({ error: errMsg });
    }

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      res.json({ text: data.candidates[0].content.parts[0].text });
    } else {
      res.status(500).json({ error: data.candidates?.[0]?.finishReason || 'Invalid AI response' });
    }
  } catch (error: any) {
    console.error('Gemini API proxy error:', error);
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
});

export default app;
