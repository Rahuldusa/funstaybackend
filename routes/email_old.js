const express = require("express");
const router = express.Router();
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const nodemailer = require("nodemailer");


router.use(express.json());

const imapConfig = {
  user: 'uppalahemanth4@gmail.com',
  password: 'oimoftsgtwradkux', // Use app-specific password if 2FA is enabled
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

const getLatestEmail = () => {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err, box) => {
        if (err) {
          reject(`Error opening inbox: ${err}`);
          imap.end();
          return;
        }

        imap.search(["ALL"], (err, results) => {
          if (err) {
            reject(`Error searching emails: ${err}`);
            imap.end();
            return;
          }

          if (!results || results.length === 0) {
            resolve("No emails found.");
            imap.end();
            return;
          }

          const latestUid = results[results.length - 1];
          const fetchOptions = { bodies: "", markSeen: true };
          const f = imap.fetch(latestUid, fetchOptions);

          f.on("message", (msg) => {
            msg.on("body", (stream) => {
              simpleParser(stream)
                .then((parsed) => {
                  const { from, subject, text, textAsHtml, date } = parsed;
                  resolve({ from, subject, text, textAsHtml, date });
                })
                .catch((err) => reject(`Error parsing email: ${err}`));
            });

            msg.once("attributes", (attrs) => {
              const { uid } = attrs;
              imap.addFlags(uid, ["\\Seen"], (err) => {
                if (err) {
                  console.error("Error marking email as read:", err);
                }
              });
            });
          });

          f.once("error", (ex) => reject(`Fetch error: ${ex}`));
          f.once("end", () => imap.end());
        });
      });
    });

    imap.once("error", (err) => reject(`IMAP error: ${err}`));
    imap.once("end", () => console.log("IMAP Connection ended."));
    imap.connect();
  });
};

router.get("/latest-email", async (req, res) => {
  try {
    const latestEmail = await getLatestEmail();
    res.json({ success: true, data: latestEmail });
  } catch (error) {
    res.status(500).json({ success: false, error: error.toString() });
  }
});

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



module.exports = router;