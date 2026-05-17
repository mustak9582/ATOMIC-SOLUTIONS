import express from 'express';
import path from 'path';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    console.log('Health check requested. NODE_ENV:', process.env.NODE_ENV);
    res.json({ 
      status: 'ok', 
      node_env: process.env.NODE_ENV,
      cwd: process.cwd(),
      timestamp: new Date().toISOString()
    });
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
  });
}

startServer();
