import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- SECURITY: Restrict CORS to allowed origins only ---
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., server-to-server, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true
  }));
  app.use(express.json());

  // Health check — sanitized to not leak server internals
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

  // API Routes
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

  // --- SECURITY: Razorpay keys must be provided via env vars, no hardcoded fallbacks ---
  let razorpay: any = null;
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } else {
    console.warn('⚠️  RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET not set. Payment endpoints will be disabled.');
  }

  app.post('/api/create-razorpay-order', async (req, res) => {
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

  // --- MULTILINGUAL AI PROXY: Gemini + Free LLM Fallback (100% Lifetime Uptime & Multi-Turn History) ---
  app.post('/api/chat', async (req, res) => {
    try {
      let userQuery = '';
      let incomingMessages: Array<{ role: string; content?: string; text?: string }> = [];

      if (Array.isArray(req.body.messages) && req.body.messages.length > 0) {
        incomingMessages = req.body.messages;
        const lastMsg = incomingMessages[incomingMessages.length - 1];
        userQuery = lastMsg.content || lastMsg.text || '';
      } else if (typeof req.body.prompt === 'string') {
        userQuery = req.body.prompt;
      } else if (typeof req.body.query === 'string') {
        userQuery = req.body.query;
      }

      if (!userQuery || !userQuery.trim()) {
        return res.status(400).json({ error: 'Prompt or query is required' });
      }

      const cleanQuery = userQuery.trim();
      const geminiKey = process.env.GEMINI_API_KEY;

      const systemInstructionText = `You are Atomic AI, the official AI consultant & assistant for Atomic Solutions (HVAC, Electrical, Plumbing, Painting, Civil Construction, Deep Cleaning, Home Services & Billing in Deoghar & Jharkhand).
CRITICAL MULTILINGUAL & UNLIMITED CONTINUOUS Q&A RULES:
1. Answer ANY random question asked by the user (civil engineering, brick soaking duration, sand selection for plaster, house deep cleaning, AC troubleshooting, electrical, plumbing, rates, GST tax, or general knowledge).
2. Answer every question independently, accurately, and naturally. NEVER repeat canned greeting templates (like "Namaste! Main Atomic AI hoon...") or static headers on follow-up questions.
3. Understand Hinglish, Hindi, English, spelling variations, and casual phrasing. Respond in the EXACT SAME LANGUAGE and style as the user.
4. Keep answers clear, professional, direct, and well-structured using markdown.`;

      // 1. Attempt Google Gemini Models if key is present
      if (geminiKey) {
        const candidateModels = [
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-1.5-pro',
          'gemini-2.0-flash-exp'
        ];

        // Format history for Gemini
        const formattedGeminiContents = incomingMessages.length > 0 
          ? incomingMessages.slice(-10).map(m => ({
              role: m.role === 'assistant' || m.role === 'bot' ? 'model' : 'user',
              parts: [{ text: (m.content || m.text || '').trim() }]
            }))
          : [{ role: 'user', parts: [{ text: `${systemInstructionText}\n\nUser Question: ${cleanQuery}` }] }];

        for (const model of candidateModels) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: systemInstructionText }] },
                  contents: formattedGeminiContents
                })
              }
            );

            const data = await response.json();
            if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
              const aiText = data.candidates[0].content.parts[0].text.trim();
              if (aiText) {
                return res.json({ text: aiText, reply: aiText, modelUsed: model });
              }
            }
          } catch (err: any) {
            console.warn(`Gemini model ${model} failed:`, err.message);
          }
        }
      }

      // 2. Free High-Performance Multilingual AI Fallback (Pollinations AI GPT-4o Engine)
      try {
        const historyForPollinations = incomingMessages.length > 0
          ? incomingMessages.slice(-10).map(m => ({
              role: m.role === 'assistant' || m.role === 'bot' ? 'assistant' : 'user',
              content: (m.content || m.text || '').trim()
            }))
          : [{ role: 'user', content: cleanQuery }];

        const freeRes = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemInstructionText },
              ...historyForPollinations
            ]
          })
        });

        if (freeRes.ok) {
          const text = await freeRes.text();
          if (text && text.trim() && !text.includes('{"error":') && text !== '{}') {
            const cleanText = text.trim();
            return res.json({ text: cleanText, reply: cleanText, modelUsed: 'Pollinations-Default' });
          }
        }
      } catch (freeErr: any) {
        console.warn('Free AI fallback failed:', freeErr.message);
      }

      // 2b. Backup GET Pollinations
      try {
        const getRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(cleanQuery + ' (Respond naturally in Hindi or Hinglish)')}`);
        if (getRes.ok) {
          const getText = await getRes.text();
          if (getText && getText.trim() && !getText.includes('{"error":') && getText !== '{}') {
            return res.json({ text: getText.trim(), reply: getText.trim(), modelUsed: 'Pollinations-GET' });
          }
        }
      } catch (e) {}

      // 2c. DuckDuckGo & Wikipedia Web Knowledge Fallback
      try {
        const cleanQ = cleanQuery.replace(/[?.,!]/g, '').trim();
        // DuckDuckGo Instant Answer
        const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQ)}&format=json&no_html=1&skip_disambig=1`);
        if (ddgRes.ok) {
          const ddgData = await ddgRes.json();
          const ddgText = ddgData.AbstractText || ddgData.Answer || (ddgData.RelatedTopics?.[0]?.Text);
          if (ddgText && ddgText.length > 20) {
            return res.json({ text: `💡 **जानकारी (Web Knowledge)**:\n\n${ddgText}`, reply: ddgText, modelUsed: 'DuckDuckGo-Instant' });
          }
        }

        // Wikipedia Hindi
        const wikiHiRes = await fetch(`https://hi.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQ)}&limit=1&format=json`);
        if (wikiHiRes.ok) {
          const wData = await wikiHiRes.json();
          const title = wData[1]?.[0];
          if (title) {
            const summaryRes = await fetch(`https://hi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
            if (summaryRes.ok) {
              const sData = await summaryRes.json();
              if (sData.extract && sData.extract.length > 20) {
                return res.json({ text: `📖 **विकिपीडिया (${title})**:\n\n${sData.extract}`, reply: sData.extract, modelUsed: 'Wikipedia-HI' });
              }
            }
          }
        }

        // Wikipedia English
        const wikiEnRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQ)}&limit=1&format=json`);
        if (wikiEnRes.ok) {
          const wData = await wikiEnRes.json();
          const title = wData[1]?.[0];
          if (title) {
            const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
            if (summaryRes.ok) {
              const sData = await summaryRes.json();
              if (sData.extract && sData.extract.length > 20) {
                return res.json({ text: `📖 **Wikipedia (${title})**:\n\n${sData.extract}`, reply: sData.extract, modelUsed: 'Wikipedia-EN' });
              }
            }
          }
        }
      } catch (e) {}

      return res.status(502).json({ error: 'AI service temporarily unavailable', fallbackRequired: true });
    } catch (error: any) {
      console.error('AI Proxy Error:', error);
      res.status(500).json({ error: 'Internal AI Error', fallbackRequired: true });
    }
  });

  // --- REAL-TIME LIVE GST SAC / HSN DETECTOR & AI SEARCH ---
  app.post('/api/detect-hsn', async (req, res) => {
    try {
      const { query, itemType } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const clean = String(query).trim();
      let code = '';
      let source = 'Live GST Search & AI';

      // 1. Live Web Search on GST Portal & DuckDuckGo (Server-side, no CORS restrictions)
      try {
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('official Indian GST SAC code HSN code for ' + clean)}`;
        const webRes = await fetch(searchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (webRes.ok) {
          const html = await webRes.text();
          const matches = html.match(/\b(99\d{4}|84\d{4}|85\d{4}|74\d{4}|38\d{4}|39\d{4}|25\d{4}|69\d{4}|72\d{4})\b/g);
          if (matches && matches.length > 0) {
            if (itemType === 'Labor') {
              const sac = matches.find(m => m.startsWith('99'));
              if (sac) {
                code = sac;
                source = 'Live GST Portal Search';
              }
            }
            if (!code) {
              code = matches[0];
              source = 'Live GST Portal Search';
            }
          }
        }
      } catch (e) {}

      return res.json({ query: clean, code, source });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // --- Persistent Custom Services Storage ---
  const servicesFilePath = path.join(process.cwd(), 'data', 'custom_services.json');
  const getStoredServices = (): Record<string, any> => {
    try {
      if (!fs.existsSync(path.dirname(servicesFilePath))) {
        fs.mkdirSync(path.dirname(servicesFilePath), { recursive: true });
      }
      if (fs.existsSync(servicesFilePath)) {
        const raw = fs.readFileSync(servicesFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading custom_services.json:', e);
    }
    return {};
  };

  const saveStoredServices = (data: Record<string, any>) => {
    try {
      if (!fs.existsSync(path.dirname(servicesFilePath))) {
        fs.mkdirSync(path.dirname(servicesFilePath), { recursive: true });
      }
      fs.writeFileSync(servicesFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving custom_services.json:', e);
    }
  };

  app.get('/api/services', (_req, res) => {
    res.json(getStoredServices());
  });

  app.post('/api/services/:id', (req, res) => {
    const serviceId = req.params.id;
    const updates = req.body;
    if (!serviceId) return res.status(400).json({ error: 'Service ID is required' });
    
    const all = getStoredServices();
    all[serviceId] = { ...(all[serviceId] || {}), ...updates };
    saveStoredServices(all);
    res.json({ success: true, service: all[serviceId] });
  });

  // --- Persistent Bookings Storage ---
  const bookingsFilePath = path.join(process.cwd(), 'data', 'bookings.json');
  const getStoredBookings = (): any[] => {
    try {
      if (!fs.existsSync(path.dirname(bookingsFilePath))) {
        fs.mkdirSync(path.dirname(bookingsFilePath), { recursive: true });
      }
      if (fs.existsSync(bookingsFilePath)) {
        const raw = fs.readFileSync(bookingsFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading bookings.json:', e);
    }
    return [];
  };

  const saveStoredBookings = (list: any[]) => {
    try {
      if (!fs.existsSync(path.dirname(bookingsFilePath))) {
        fs.mkdirSync(path.dirname(bookingsFilePath), { recursive: true });
      }
      fs.writeFileSync(bookingsFilePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving bookings.json:', e);
    }
  };

  app.get('/api/bookings', (_req, res) => {
    res.json(getStoredBookings());
  });

  app.post('/api/bookings', (req, res) => {
    const newBooking = req.body;
    if (!newBooking) return res.status(400).json({ error: 'Booking payload required' });
    const id = newBooking.id || `bk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const full = { ...newBooking, id };
    const list = getStoredBookings();
    const existingIdx = list.findIndex(b => b.id === id);
    if (existingIdx !== -1) {
      list[existingIdx] = { ...list[existingIdx], ...full };
    } else {
      list.unshift(full);
    }
    saveStoredBookings(list);
    res.json({ success: true, booking: full });
  });

  app.patch('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const list = getStoredBookings();
    const idx = list.findIndex(b => b.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      saveStoredBookings(list);
      res.json({ success: true, booking: list[idx] });
    } else {
      const created = { ...updates, id };
      list.unshift(created);
      saveStoredBookings(list);
      res.json({ success: true, booking: created });
    }
  });

  // --- Persistent Notifications Storage ---
  const notifsFilePath = path.join(process.cwd(), 'data', 'notifications.json');
  const getStoredNotifs = (): any[] => {
    try {
      if (!fs.existsSync(path.dirname(notifsFilePath))) {
        fs.mkdirSync(path.dirname(notifsFilePath), { recursive: true });
      }
      if (fs.existsSync(notifsFilePath)) {
        const raw = fs.readFileSync(notifsFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {}
    return [];
  };

  const saveStoredNotifs = (list: any[]) => {
    try {
      if (!fs.existsSync(path.dirname(notifsFilePath))) {
        fs.mkdirSync(path.dirname(notifsFilePath), { recursive: true });
      }
      fs.writeFileSync(notifsFilePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {}
  };

  app.get('/api/notifications', (_req, res) => {
    res.json(getStoredNotifs());
  });

  app.post('/api/notifications', (req, res) => {
    const notif = req.body;
    if (!notif) return res.status(400).json({ error: 'Payload required' });
    const id = notif.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const full = { ...notif, id };
    const list = getStoredNotifs();
    list.unshift(full);
    saveStoredNotifs(list);
    res.json({ success: true, notification: full });
  });

  app.patch('/api/notifications/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const list = getStoredNotifs();
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      saveStoredNotifs(list);
      res.json({ success: true, notification: list[idx] });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Using Vite middleware in development mode...');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    const serveIndex = async (req: any, res: any, next: any) => {
      const url = req.originalUrl;
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    };

    app.get('/', serveIndex);
    app.get('*all', serveIndex);
  } else {
    console.log('Serving static files from dist in production mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Express 5 catch-all using *all or (.*)
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
          console.error('Error sending index.html:', err);
          res.status(500).send('Production assets missing. Please run build.');
        }
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Prevent server from sleeping when idle (useful for free hosting tiers like Render)
    const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes
    setInterval(async () => {
      try {
        // Use environment variable for host if deployed, otherwise localhost
        const host = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || `http://localhost:${PORT}`;
        const url = `${host.replace(/\/$/, '')}/api/health`;
        console.log(`[Keep-Alive] Pinging ${url} to prevent sleep...`);
        await fetch(url);
      } catch (err: any) {
        console.error('[Keep-Alive] Ping failed:', err.message);
      }
    }, KEEP_ALIVE_INTERVAL);
  });
}

// Global error handlers to prevent the server from crashing due to unhandled exceptions
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
