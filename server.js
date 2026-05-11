const express = require('express');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const app = express();
const port = 3000;

// Define IMAP configuration
const imapConfig = {
  user: 'iiiqbetsvarnaaz@gmail.com',
  password: 'rbdy vard mzit ybse', // Use app-specific password if 2FA is enabled
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  connTimeout: 10000, // 10 seconds timeout
  authTimeout: 5000,  // 5 seconds timeout
};

// Function to fetch the latest email
const getLatestEmail = async () => {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          reject(`Error opening inbox: ${err}`);
          imap.end();
          return;
        }

        // Search for all emails
        imap.search(['ALL'], (err, results) => {
          if (err) {
            reject(`Error searching emails: ${err}`);
            imap.end();
            return;
          }

          if (!results || results.length === 0) {
            resolve('No emails found.');
            imap.end();
            return;
          }

          // Get the latest email UID
          const latestUid = results[results.length - 1];
          const f = imap.fetch(latestUid, { bodies: '' });

          f.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream)
                .then((parsed) => {
                  const { from, subject, text, textAsHtml } = parsed;
                  resolve({ from, subject, text, textAsHtml });
                  console.log("====================================");
                  console.log(`From: ${from.value[0].address}`);
                  console.log(`Subject: ${subject}`);
                  console.log(`Message: ${text}`);
                  console.log("====================================");
                })
                .catch((err) => {
                  reject(`Error parsing email: ${err}`);
                });
            });

            msg.once('attributes', (attrs) => {
              const { uid } = attrs;
              imap.addFlags(uid, ['\\Seen'], (err) => {
                if (err) {
                  console.error('Error marking email as read:', err);
                } else {
                  console.log(`Email with UID ${uid} marked as read.`);
                }
              });
            });
          });

          f.once('error', (ex) => {
            reject(`Fetch error: ${ex}`);
          });

          f.once('end', () => {
            imap.end();
          });
        });
      });
    });

    imap.once('error', (err) => {
      reject(`IMAP error: ${err}`);
    });

    imap.once('end', () => {
      console.log('Connection ended.');
    });

    imap.connect();
  });
};

// Start the Express server
app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  
  // Fetch and display the latest email when the server starts
  try {
    await getLatestEmail();
  } catch (error) {
    console.error('Error fetching latest email:', error);
  }
});