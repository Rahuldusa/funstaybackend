const express = require("express");
const router = express.Router();
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const nodemailer = require("nodemailer");
const db = require("../config/db");

router.use(express.json());

const allowedEmails = ["uppalahemanth4@gmail.com", "uppalabharadwaj31@gmail.com"];

const imapConfig = {
  user: "uppalahemanth4@gmail.com",
  password: "oimoftsgtwradkux",
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  authTimeout: 10000,
};

// Fetch Emails and Store in MySQL
const getLatestEmail = async () => {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error(`Error opening inbox: ${err}`);
          reject(err);
          imap.end();
          return;
        }

        imap.search(['ALL'], (err, results) => {
          if (err) {
            console.error(`Error searching emails: ${err}`);
            reject(err);
            imap.end();
            return;
          }

          if (!results || results.length === 0) {
            console.log("No emails found.");
            resolve('No emails found.');
            imap.end();
            return;
          }

          const latestUid = results[results.length - 1];
          const f = imap.fetch(latestUid, { bodies: '' });

          f.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream)
                .then((parsed) => {
                  const { from, subject, text } = parsed;
                  console.log(`From: ${from.value[0].address}, Subject: ${subject}`);
                  resolve({ from, subject, text });
                })
                .catch((err) => {
                  console.error("Error parsing email:", err);
                  reject(err);
                });
            });
          });

          f.once('error', (ex) => {
            console.error("Fetch error:", ex);
            reject(ex);
          });

          f.once('end', () => {
            console.log("Fetching complete.");
            imap.end();
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error(`IMAP error: ${err.message}`);
      reject(err);
    });

    imap.once('end', () => {
      console.log('IMAP connection ended.');
    });

    imap.connect();
  });
};


// Fetch Emails API
router.get("/emails", (req, res) => {
  db.query("SELECT * FROM emails ORDER BY date DESC", (err, results) => {
    if (err) {
      console.error("Error fetching emails from database:", err);
      res.status(500).json({ success: false, error: err.message });
    } else {
      console.log("Fetched emails from database:", results);
      res.json({ success: true, data: results });
    }
  });
});

// Send Email & Store in MySQL
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "uppalahemanth4@gmail.com",
    pass: "oimoftsgtwradkux",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

router.post("/send-email", (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ success: false, error: "All fields are required!" });
  }

  transporter.sendMail(
    {
      from: "uppalahemanth4@gmail.com",
      to,
      subject,
      text,
    },
    (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      // Store Sent Email in MySQL
      const sql = "INSERT INTO emails (sender, recipient, subject, message, date) VALUES (?, ?, ?, ?, NOW())";
      db.query(sql, ["uppalahemanth4@gmail.com", to, subject, text], (err) => {
        if (err) {
          console.error("Error storing sent email:", err);
        }
      });

      res.json({ success: true, message: "Email sent successfully" });
    }
  );
});

// Automatically Fetch Emails Every 5 Minutes
setInterval(() => {
  console.log("Checking for new emails...");
  getLatestEmail();
}, 100000); // Runs every 5 minutes (300000ms)

module.exports = router;