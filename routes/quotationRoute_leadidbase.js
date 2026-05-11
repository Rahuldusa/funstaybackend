const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const router = express.Router();
const db = require('../config/db');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Multer Configuration (Ensure file is saved with correct format)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Extract the original file extension
        const ext = path.extname(file.originalname);
        const filename = `${file.fieldname}-${Date.now()}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({ storage });


// IMAP Configuration for Receiving Emails



// const imapConfig = {
//     user: 'iiiqbetsvarnaaz@gmail.com', // Replace with your admin email
//     password: 'rbdy vard mzit ybse', // Replace with your app password
//     host: 'imap.gmail.com',
//     port: 993,
//     tls: true,
//     tlsOptions: { rejectUnauthorized: false },
//     authTimeout: 30000,
// };



// Function to Fetch and Store Today's Emails for Recognized Receiver Emails
// const fetchAndStoreEmails = async () => {
//     return new Promise((resolve, reject) => {
//         // Step 1: Get the distinct receiver emails from the database
//         const receiverQuery = 'SELECT DISTINCT receiver_email FROM emails';
//         db.query(receiverQuery, (err, receivers) => {
//             if (err) {
//                 console.error('Database error fetching receivers:', err);
//                 return reject(err);
//             }

//             // Convert receiver emails into a Set for faster lookup
//             const receiverSet = new Set(receivers.map(row => row.receiver_email));

//             const imap = new Imap(imapConfig);

//             imap.once('ready', () => {
//                 imap.openBox('INBOX', false, (err, box) => {
//                     if (err) {
//                         console.error('Error opening inbox:', err);
//                         imap.end();
//                         return reject(err);
//                     }

//                     // Get today's date in IMAP format (DD-MMM-YYYY)
//                     const today = new Date();
//                     const formattedDate = today.toLocaleString('en-US', {
//                         day: '2-digit',
//                         month: 'short',
//                         year: 'numeric',
//                     }).replace(',', '');

//                     console.log(`Fetching emails for today: ${formattedDate}`);

//                     // Search for today's emails
//                     imap.search([['ON', formattedDate]], (err, results) => {
//                         if (err) {
//                             console.error('IMAP search error:', err);
//                             imap.end();
//                             return reject(err);
//                         }

//                         if (!results.length) {
//                             console.log('No new emails found for today.');
//                             imap.end();
//                             return resolve('No new emails.');
//                         }

//                         const f = imap.fetch(results, { bodies: '' });

//                         f.on('message', (msg) => {
//                             msg.on('body', (stream) => {
//                                 simpleParser(stream)
//                                     .then((parsed) => {
//                                         const { from, subject, text, messageId } = parsed;
//                                         const senderEmail = from.value[0].address; // The email of the sender

//                                         // Step 2: Check if sender exists in receiverSet
//                                         if (!receiverSet.has(senderEmail)) {
//                                             console.log(`Ignored email from unrecognized sender: ${senderEmail}`);
//                                             return;
//                                         }

//                                         // Step 3: Check if email already exists in the database
//                                         const checkQuery = 'SELECT COUNT(*) AS count FROM emails WHERE message_id = ?';
//                                         db.query(checkQuery, [messageId], (err, result) => {
//                                             if (err) {
//                                                 console.error('Database error checking for duplicate email:', err);
//                                                 return;
//                                             }

//                                             if (result[0].count === 0) {
//                                                 // Step 4: Store email in MySQL with type 'received'
//                                                 const insertQuery =
//                                                     'INSERT INTO emails (message_id, receiver_email, subject, text, type) VALUES (?, ?, ?, ?, ?)';
//                                                 db.query(
//                                                     insertQuery,
//                                                     [messageId, senderEmail, subject, text, 'received'], // Include message_id
//                                                     (err) => {
//                                                         if (err) console.error('Failed to store email:', err);
//                                                         else console.log(`Email from ${senderEmail} stored successfully.`);
//                                                     }
//                                                 );
//                                             } else {
//                                                 console.log('Duplicate email ignored:', messageId);
//                                             }
//                                         });
//                                     })
//                                     .catch((err) => console.error('Error parsing email:', err));
//                             });
//                         });

//                         f.once('error', (ex) => {
//                             console.error('Fetch error:', ex);
//                             reject(ex);
//                         });

//                         f.once('end', () => {
//                             console.log('Finished fetching today’s emails.');
//                             imap.end();
//                         });
//                     });
//                 });
//             });

//             imap.once('error', (err) => {
//                 console.error('IMAP error:', err);
//                 reject(err);
//             });

//             imap.connect();
//         });
//     });
// };

//receiver mails reply
// const fetchAndStoreEmailsForAllUsers = async () => {
//     return new Promise((resolve, reject) => {
//         // Step 1: Get all known receiver emails (sent emails from our system)
//         db.query('SELECT DISTINCT receiver_email FROM emails', (err, receivers) => {
//             if (err) return reject(err);

//             const knownReceivers = new Set(receivers.map(r => r.receiver_email.toLowerCase().trim()));

//             // Step 2: Get all sender credentials
//             db.query('SELECT * FROM email_credentials', async (err, credentials) => {
//                 if (err) return reject(err);
//                 if (!credentials.length) return resolve('No email credentials found');

//                 // Step 3: Process each email credential
//                 for (const cred of credentials) {
//                     const imapConfig = {
//                         user: cred.sender_email,
//                         password: cred.app_password,
//                         host: 'imap.gmail.com',
//                         port: 993,
//                         tls: true,
//                         tlsOptions: { rejectUnauthorized: false },
//                         authTimeout: 30000
//                     };

//                     await fetchAndStoreEmailsForUser(imapConfig, knownReceivers);
//                 }

//                 resolve('All email accounts processed');
//             });
//         });
//     });
// };

// const fetchAndStoreEmailsForUser = (imapConfig, knownReceivers) => {
//     return new Promise((resolve, reject) => {
//         const imap = new Imap(imapConfig);

//         imap.once('ready', () => {
//             imap.openBox('INBOX', false, (err) => {
//                 if (err) return reject(err);

//                 const date = new Date().toLocaleString('en-US', {
//                     day: '2-digit',
//                     month: 'short',
//                     year: 'numeric'
//                 }).replace(',', '');

//                 imap.search([['ON', date]], (err, uids) => {
//                     if (err) return reject(err);
//                     if (!uids.length) {
//                         imap.end();
//                         return resolve('No new emails');
//                     }

//                     const fetch = imap.fetch(uids, { bodies: '' });
//                     let processedCount = 0;

//                     fetch.on('message', (msg) => {
//                         let emailData = {};

//                         msg.on('body', (stream) => {
//                             simpleParser(stream, (err, parsed) => {
//                                 if (err) return console.error('Parse error:', err);

//                                 const sender = parsed.from?.value?.[0]?.address;
//                                 if (!sender || !knownReceivers.has(sender.toLowerCase().trim())) {
//                                     return;
//                                 }

//                                 let cleanText = '';
//                                 if (parsed.text) {
//                                     cleanText = parsed.text
//                                         .replace(/\r\n/g, '\n')
//                                         .replace(/\t/g, '    ');
//                                 } else if (parsed.html) {
//                                     cleanText = parsed.html
//                                         .replace(/<br\s*\/?>/gi, '\n')
//                                         .replace(/<\/p>/gi, '\n\n')
//                                         .replace(/<[^>]+>/g, '')
//                                         .replace(/&nbsp;/g, ' ')
//                                         .replace(/ +/g, ' ')
//                                         .trim();
//                                 }

//                                 emailData = {
//                                     message_id: parsed.messageId,
//                                     receiver_email: sender,
//                                     subject: parsed.subject || '(No subject)',
//                                     text: cleanText || '[No text content]',
//                                     type: 'received'
//                                 };

//                                 db.query(
//                                     'SELECT COUNT(*) AS count FROM emails WHERE message_id = ?',
//                                     [emailData.message_id],
//                                     (err, result) => {
//                                         if (err) return console.error('DB check error:', err);

//                                         if (result[0].count === 0) {
//                                             db.query(
//                                                 'INSERT INTO emails SET ?',
//                                                 emailData,
//                                                 (err) => {
//                                                     if (err) {
//                                                         console.error('Store error:', err);
//                                                     } else {
//                                                         console.log('Stored email from:', emailData.receiver_email);

//                                                         db.query(
//                                                             `SELECT leadid FROM emails 
//                                                              WHERE receiver_email = ? 
//                                                              AND type = 'sent' 
//                                                              ORDER BY created_at DESC 
//                                                              LIMIT 1`,
//                                                             [emailData.receiver_email],
//                                                             (err, sentEmails) => {
//                                                                 if (err) return console.error('LeadID error:', err);

//                                                                 if (sentEmails.length > 0) {
//                                                                     const leadId = sentEmails[0].leadid;
//                                                                     const notificationData = {
//                                                                         leadid: leadId,
//                                                                         email: emailData.receiver_email,
//                                                                         subject: emailData.subject,
//                                                                         text: emailData.text,
//                                                                         created_at: new Date()
//                                                                     };

//                                                                     db.query(
//                                                                         'INSERT INTO email_notifications SET ?',
//                                                                         notificationData,
//                                                                         (err) => {
//                                                                             if (err) {
//                                                                                 console.error('Notification insert error:', err);
//                                                                             } else {
//                                                                                 console.log('Notification stored for lead:', leadId);
//                                                                             }
//                                                                             processedCount++;
//                                                                             if (processedCount === uids.length) {
//                                                                                 imap.end();
//                                                                             }
//                                                                         }
//                                                                     );
//                                                                 } else {
//                                                                     console.log('No sent mail found for:', emailData.receiver_email);
//                                                                     processedCount++;
//                                                                     if (processedCount === uids.length) {
//                                                                         imap.end();
//                                                                     }
//                                                                 }
//                                                             }
//                                                         );
//                                                     }
//                                                 }
//                                             );
//                                         } else {
//                                             processedCount++;
//                                             if (processedCount === uids.length) {
//                                                 imap.end();
//                                             }
//                                         }
//                                     }
//                                 );
//                             });
//                         });
//                     });

//                     fetch.once('end', () => {
//                         if (processedCount === uids.length) {
//                             imap.end();
//                         }
//                         resolve('Done fetching emails');
//                     });

//                     fetch.once('error', reject);
//                 });
//             });
//         });

//         imap.once('error', (err) => {
//             console.error(`IMAP error for ${imapConfig.user}:`, err.message);
//             resolve(); // Don't fail the whole batch if one user fails
//         });

//         imap.connect();
//     });
// };




// const fetchAndStoreEmails = async () => {
//     return new Promise((resolve, reject) => {
//         // Get all known receiver emails
//         db.query('SELECT DISTINCT receiver_email FROM emails', (err, receivers) => {
//             if (err) return reject(err);

//             const knownReceivers = new Set(receivers.map(r => r.receiver_email.toLowerCase().trim()));
//             const imap = new Imap(imapConfig);

//             imap.once('ready', () => {
//                 imap.openBox('INBOX', false, (err) => {
//                     if (err) return reject(err);

//                     // Search for today's emails
//                     const date = new Date().toLocaleString('en-US', {
//                         day: '2-digit',
//                         month: 'short',
//                         year: 'numeric'
//                     }).replace(',', '');

//                     imap.search([['ON', date]], (err, uids) => {
//                         if (err) return reject(err);
//                         if (!uids.length) return resolve('No new emails');

//                         const fetch = imap.fetch(uids, { bodies: '' });
//                         let processedCount = 0;

//                         fetch.on('message', (msg) => {
//                             let emailData = {};

//                             msg.on('body', (stream) => {
//                                 simpleParser(stream, (err, parsed) => {
//                                     if (err) return console.error('Parse error:', err);

//                                     // Extract sender email
//                                     const sender = parsed.from?.value?.[0]?.address;
//                                     if (!sender || !knownReceivers.has(sender.toLowerCase().trim())) {
//                                         return; // Skip unknown senders
//                                     }

//                                     // Get clean plain text content
//                                     let cleanText = '';
//                                     if (parsed.text) {
//                                         cleanText = parsed.text
//                                             .replace(/\r\n/g, '\n')
//                                             .replace(/\t/g, '    ');
//                                     } else if (parsed.html) {
//                                         cleanText = parsed.html
//                                             .replace(/<br\s*\/?>/gi, '\n')
//                                             .replace(/<\/p>/gi, '\n\n')
//                                             .replace(/<[^>]+>/g, '')
//                                             .replace(/&nbsp;/g, ' ')
//                                             .replace(/ +/g, ' ')
//                                             .trim();
//                                     }

//                                     emailData = {
//                                         message_id: parsed.messageId,
//                                         receiver_email: sender,
//                                         subject: parsed.subject || '(No subject)',
//                                         text: cleanText || '[No text content]',
//                                         type: 'received'
//                                     };

//                                     // Check if email exists
//                                     db.query(
//                                         'SELECT COUNT(*) AS count FROM emails WHERE message_id = ?',
//                                         [emailData.message_id],
//                                         (err, result) => {
//                                             if (err) return console.error('DB check error:', err);

//                                             if (result[0].count === 0) {
//                                                 // First store in emails table
//                                                 db.query(
//                                                     'INSERT INTO emails SET ?',
//                                                     emailData,
//                                                     (err) => {
//                                                         if (err) {
//                                                             console.error('Store error:', err);
//                                                         } else {
//                                                             console.log('Stored email:', {
//                                                                 from: emailData.receiver_email,
//                                                                 subject: emailData.subject,
//                                                                 textLength: emailData.text.length
//                                                             });

//                                                             // Now find the lead ID from previous sent emails
//                                                             db.query(
//                                                                 `SELECT leadid FROM emails 
//                                                                  WHERE receiver_email = ? 
//                                                                  AND type = 'sent' 
//                                                                  ORDER BY created_at DESC 
//                                                                  LIMIT 1`,
//                                                                 [emailData.receiver_email],
//                                                                 (err, sentEmails) => {
//                                                                     if (err) {
//                                                                         console.error('Error finding lead ID:', err);
//                                                                         return;
//                                                                     }

//                                                                     if (sentEmails.length > 0) {
//                                                                         const leadId = sentEmails[0].leadid;
//                                                                         // Store in email_notifications table
//                                                                         const notificationData = {
//                                                                             leadid: leadId,
//                                                                             email: emailData.receiver_email,
//                                                                             subject: emailData.subject,
//                                                                             text: emailData.text,
//                                                                             created_at: new Date()
//                                                                         };

//                                                                         db.query(
//                                                                             'INSERT INTO email_notifications SET ?',
//                                                                             notificationData,
//                                                                             (err) => {
//                                                                                 if (err) {
//                                                                                     console.error('Error storing notification:', err);
//                                                                                 } else {
//                                                                                     console.log('Stored notification for lead:', leadId);
//                                                                                 }
//                                                                                 processedCount++;
//                                                                                 if (processedCount === uids.length) {
//                                                                                     imap.end();
//                                                                                 }
//                                                                             }
//                                                                         );
//                                                                     } else {
//                                                                         console.log('No matching sent email found for:', emailData.receiver_email);
//                                                                         processedCount++;
//                                                                         if (processedCount === uids.length) {
//                                                                             imap.end();
//                                                                         }
//                                                                     }
//                                                                 }
//                                                             );
//                                                         }
//                                                     }
//                                                 );
//                                             } else {
//                                                 processedCount++;
//                                                 if (processedCount === uids.length) {
//                                                     imap.end();
//                                                 }
//                                             }
//                                         }
//                                     );
//                                 });
//                             });
//                         });

//                         fetch.once('end', () => {
//                             if (processedCount === uids.length) {
//                                 imap.end();
//                             }
//                             resolve('Processing completed');
//                         });

//                         fetch.once('error', reject);
//                     });
//                 });
//             });

//             imap.once('error', reject);
//             imap.connect();
//         });
//     });
// };

// const fetchAndStoreEmails = async () => {
//     return new Promise((resolve, reject) => {
//         // Get all known receiver emails
//         db.query('SELECT DISTINCT receiver_email FROM emails', (err, receivers) => {
//             if (err) return reject(err);

//             const knownReceivers = new Set(receivers.map(r => r.receiver_email.toLowerCase().trim()));
//             const imap = new Imap(imapConfig);

//             imap.once('ready', () => {
//                 imap.openBox('INBOX', false, (err) => {
//                     if (err) return reject(err);

//                     // Search for today's emails
//                     const date = new Date().toLocaleString('en-US', {
//                         day: '2-digit',
//                         month: 'short',
//                         year: 'numeric'
//                     }).replace(',', '');

//                     imap.search([['ON', date]], (err, uids) => {
//                         if (err) return reject(err);
//                         if (!uids.length) return resolve('No new emails');

//                         const fetch = imap.fetch(uids, { bodies: '' });
//                         let processedCount = 0;

//                         fetch.on('message', (msg) => {
//                             let emailData = {};

//                             msg.on('body', (stream) => {
//                                 simpleParser(stream, (err, parsed) => {
//                                     if (err) return console.error('Parse error:', err);

//                                     // Extract sender email
//                                     const sender = parsed.from?.value?.[0]?.address;
//                                     if (!sender || !knownReceivers.has(sender.toLowerCase().trim())) {
//                                         processedCount++;
//                                         if (processedCount === uids.length) {
//                                             imap.end();
//                                         }
//                                         return; // Skip unknown senders
//                                     }

//                                     // Get clean plain text content
//                                     let cleanText = '';
//                                     if (parsed.text) {
//                                         cleanText = parsed.text
//                                             .replace(/\r\n/g, '\n')
//                                             .replace(/\t/g, '    ');
//                                     } else if (parsed.html) {
//                                         cleanText = parsed.html
//                                             .replace(/<br\s*\/?>/gi, '\n')
//                                             .replace(/<\/p>/gi, '\n\n')
//                                             .replace(/<[^>]+>/g, '')
//                                             .replace(/&nbsp;/g, ' ')
//                                             .replace(/ +/g, ' ')
//                                             .trim();
//                                     }

//                                     emailData = {
//                                         message_id: parsed.messageId,
//                                         receiver_email: sender,
//                                         subject: parsed.subject || '(No subject)',
//                                         text: cleanText || '[No text content]',
//                                         type: 'received'
//                                     };

//                                     // Check if email exists
//                                     db.query(
//                                         'SELECT COUNT(*) AS count FROM emails WHERE message_id = ?',
//                                         [emailData.message_id],
//                                         (err, result) => {
//                                             if (err) return console.error('DB check error:', err);

//                                             if (result[0].count === 0) {
//                                                 // First store in emails table
//                                                 db.query(
//                                                     'INSERT INTO emails SET ?',
//                                                     emailData,
//                                                     (err) => {
//                                                         if (err) {
//                                                             console.error('Store error:', err);
//                                                             processedCount++;
//                                                             if (processedCount === uids.length) {
//                                                                 imap.end();
//                                                             }
//                                                             return;
//                                                         }

//                                                         console.log('Stored email:', {
//                                                             from: emailData.receiver_email,
//                                                             subject: emailData.subject,
//                                                             textLength: emailData.text.length
//                                                         });

//                                                         // Now find the lead ID from previous sent emails
//                                                         db.query(
//                                                             `SELECT leadid FROM emails 
//                                                              WHERE receiver_email = ? 
//                                                              AND type = 'sent' 
//                                                              ORDER BY created_at DESC 
//                                                              LIMIT 1`,
//                                                             [emailData.receiver_email],
//                                                             (err, sentEmails) => {
//                                                                 if (err) {
//                                                                     console.error('Error finding lead ID:', err);
//                                                                     processedCount++;
//                                                                     if (processedCount === uids.length) {
//                                                                         imap.end();
//                                                                     }
//                                                                     return;
//                                                                 }

//                                                                 if (sentEmails.length > 0) {
//                                                                     const leadId = sentEmails[0].leadid;
                                                                    
//                                                                     // Get lead details from addleads table
//                                                                     db.query(
//                                                                         'SELECT assignedSalesId, managerid FROM addleads WHERE leadid = ?',
//                                                                         [leadId],
//                                                                         (err, leadDetails) => {
//                                                                             if (err) {
//                                                                                 console.error('Error fetching lead details:', err);
//                                                                                 processedCount++;
//                                                                                 if (processedCount === uids.length) {
//                                                                                     imap.end();
//                                                                                 }
//                                                                                 return;
//                                                                             }

//                                                                             if (leadDetails.length === 0) {
//                                                                                 // Lead not found, just store with admin
//                                                                                 storeNotification(leadId, emailData, { adminid: 'admin' }, () => {
//                                                                                     processedCount++;
//                                                                                     if (processedCount === uids.length) {
//                                                                                         imap.end();
//                                                                                     }
//                                                                                 });
//                                                                                 return;
//                                                                             }

//                                                                             const leadInfo = leadDetails[0];
//                                                                             const notificationsToStore = [];

//                                                                             // Always include admin notification
//                                                                             notificationsToStore.push({ adminid: 'admin' });

//                                                                             // Check for assigned sales person
//                                                                             if (leadInfo.assignedSalesId) {
//                                                                                 notificationsToStore.push({ employeeId: leadInfo.assignedSalesId });
//                                                                             }

//                                                                             // Check for manager
//                                                                             if (leadInfo.managerid) {
//                                                                                 notificationsToStore.push({ managerid: leadInfo.managerid });
//                                                                             }

//                                                                             // Store all notifications
//                                                                             let notificationsStored = 0;
//                                                                             const totalNotifications = notificationsToStore.length;

//                                                                             notificationsToStore.forEach((recipient) => {
//                                                                                 storeNotification(
//                                                                                     leadId,
//                                                                                     emailData,
//                                                                                     recipient,
//                                                                                     () => {
//                                                                                         notificationsStored++;
//                                                                                         if (notificationsStored === totalNotifications) {
//                                                                                             processedCount++;
//                                                                                             if (processedCount === uids.length) {
//                                                                                                 imap.end();
//                                                                                             }
//                                                                                         }
//                                                                                     }
//                                                                                 );
//                                                                             });
//                                                                         }
//                                                                     );
//                                                                 } else {
//                                                                     console.log('No matching sent email found for:', emailData.receiver_email);
//                                                                     processedCount++;
//                                                                     if (processedCount === uids.length) {
//                                                                         imap.end();
//                                                                     }
//                                                                 }
//                                                             }
//                                                         );
//                                                     }
//                                                 );
//                                             } else {
//                                                 processedCount++;
//                                                 if (processedCount === uids.length) {
//                                                     imap.end();
//                                                 }
//                                             }
//                                         }
//                                     );
//                                 });
//                             });
//                         });

//                         fetch.once('end', () => {
//                             if (processedCount === uids.length) {
//                                 imap.end();
//                             }
//                             resolve('Processing completed');
//                         });

//                         fetch.once('error', reject);
//                     });
//                 });
//             });

//             imap.once('error', reject);
//             imap.connect();
//         });
//     });
// };

// Helper function to store a single notification
// function storeNotification(leadId, emailData, recipient, callback) {
//     const notificationData = {
//         leadid: leadId,
//         email: emailData.receiver_email,
//         subject: emailData.subject,
//         text: emailData.text,
//         created_at: new Date(),
//         ...recipient
//     };

//     db.query(
//         'INSERT INTO email_notifications SET ?',
//         notificationData,
//         (err) => {
//             if (err) {
//                 console.error('Error storing notification:', err);
//             } else {
//                 console.log('Stored notification for lead:', leadId, 'with recipient:', recipient);
//             }
//             callback();
//         }
//     );
// }

// Automatically Fetch Emails Every 5 Minutes
// setInterval(() => {
//     console.log('Checking for new emails...');
//     fetchAndStoreEmailsForAllUsers().catch((err) => console.error('Error in automatic email fetching:', err));
// }, 100000); // 5 minutes


const fetchAndStoreEmailsForAllUsers = async () => {
    return new Promise((resolve, reject) => {
        db.query('SELECT DISTINCT receiver_email FROM emails WHERE type = "sent"', (err, receivers) => {
            if (err) return reject(err);

            const knownReceivers = new Set(receivers.map(r => r.receiver_email.toLowerCase().trim()));

            db.query('SELECT * FROM email_credentials', async (err, credentials) => {
                if (err) return reject(err);
                if (!credentials.length) return resolve('No email credentials found');

                for (const cred of credentials) {
                    

                        const imapConfig = {
                            user: cred.sender_email,
                            password: cred.app_password, // Make sure this is an app password if using 2FA
                            host: 'imap.titan.email',
                            port: 993,
                            tls: true,
                            tlsOptions: { 
                                rejectUnauthorized: false 
                            },
                            authTimeout: 30000,
                            // Add these IMAP-specific options:
                            autotls: 'never',
                            connTimeout: 30000
                        };

                    await fetchAndStoreEmailsForUser(imapConfig, knownReceivers);
                }

                resolve('All email accounts processed');
            });
        });
    });
};

const fetchAndStoreEmailsForUser = (imapConfig, knownReceivers) => {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);

        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err) => {
                if (err) return reject(err);

                const today = new Date();
                const searchDate = today.toISOString().split('T')[0];

                imap.search([['SINCE', searchDate]], (err, uids) => {
                    if (err || !uids.length) {
                        imap.end();
                        return resolve('No new emails');
                    }

                    const fetch = imap.fetch(uids, { bodies: '' });
                    let processedCount = 0;

                    fetch.on('message', (msg) => {
                        let emailData = {};

                        msg.on('body', (stream) => {
                            simpleParser(stream, (err, parsed) => {
                                if (err) return console.error('Parse error:', err);

                                const sender = parsed.from?.value?.[0]?.address;
                                if (!sender || !knownReceivers.has(sender.toLowerCase().trim())) {
                                    processedCount++;
                                    if (processedCount === uids.length) imap.end();
                                    return;
                                }

                                let cleanText = parsed.text || parsed.html?.replace(/<[^>]+>/g, '') || '[No text content]';

                                emailData = {
                                    message_id: parsed.messageId,
                                    receiver_email: sender,
                                    subject: parsed.subject || '(No subject)',
                                    text: cleanText.trim(),
                                    type: 'received'
                                };

                                db.query('SELECT COUNT(*) AS count FROM emails WHERE message_id = ?', [emailData.message_id], (err, result) => {
                                    if (err) return console.error('DB check error:', err);

                                    if (result[0].count === 0) {
                                        // First look for the leadid from previous sent emails
                                        db.query(
                                            `SELECT leadid FROM emails 
                                             WHERE receiver_email = ? 
                                             AND type = 'sent' 
                                             ORDER BY created_at DESC 
                                             LIMIT 1`,
                                            [emailData.receiver_email],
                                            (err, sentEmails) => {
                                                if (err) return console.error('LeadID error:', err);

                                                if (sentEmails.length > 0) {
                                                    const leadId = sentEmails[0].leadid;
                                                    // Add leadid to the emailData before inserting
                                                    emailData.leadid = leadId;

                                                    const notificationData = {
                                                        leadid: leadId,
                                                        email: emailData.receiver_email,
                                                        subject: emailData.subject,
                                                        text: emailData.text,
                                                        created_at: new Date()
                                                    };

                                                    // Insert into emails table with leadid
                                                    db.query('INSERT INTO emails SET ?', emailData, (err) => {
                                                        if (err) {
                                                            console.error('Store error:', err);
                                                        } else {
                                                            console.log('Stored email from:', emailData.receiver_email);
                                                            
                                                            // Insert into notifications table
                                                            db.query('INSERT INTO email_notifications SET ?', notificationData, (err) => {
                                                                if (err) console.error('Notification insert error:', err);
                                                                else console.log('Notification stored for lead:', leadId);
                                                            });
                                                        }

                                                        processedCount++;
                                                        if (processedCount === uids.length) imap.end();
                                                    });
                                                } else {
                                                    // No leadid found, insert without it
                                                    db.query('INSERT INTO emails SET ?', emailData, (err) => {
                                                        if (err) {
                                                            console.error('Store error:', err);
                                                        } else {
                                                            console.log('Stored email from:', emailData.receiver_email);
                                                            console.log('No related sent mail for:', emailData.receiver_email);
                                                        }

                                                        processedCount++;
                                                        if (processedCount === uids.length) imap.end();
                                                    });
                                                }
                                            }
                                        );
                                    } else {
                                        processedCount++;
                                        if (processedCount === uids.length) imap.end();
                                    }
                                });
                            });
                        });
                    });

                    fetch.once('end', () => {
                        if (processedCount === uids.length) imap.end();
                        resolve('Done fetching emails');
                    });

                    fetch.once('error', reject);
                });
            });
        });

        imap.once('error', (err) => {
            console.error(`IMAP error for ${imapConfig.user}:`, err.message);
            resolve(); // don't break the whole loop
        });

        imap.connect();
    });
};

// Run periodically
setInterval(() => {
    console.log('Checking for new emails...');
    fetchAndStoreEmailsForAllUsers().catch((err) => console.error('Error in email fetching:', err));
}, 100000); // every 5 minutes

// POST route to upload file, send email, and store in DB
router.post("/upload-quotation", upload.single("file"), async (req, res) => {
    const { email, leadid } = req.body;
    const file = req.file;

    if (!file || !email || !leadid) {
        return res.status(400).json({ error: "Missing file, email, or leadid." });
    }

    const filePath = `/uploads/${file.filename}`;
    console.log("File stored at:", filePath);

    try {
        // ✅ Fetch latest quotation_id from emails table
        const newQuotationId = await new Promise((resolve, reject) => {
            const fetchQuotationQuery = `
                SELECT quotation_id 
                FROM emails 
                WHERE quotation_id IS NOT NULL 
                ORDER BY id DESC 
                LIMIT 1
            `;

            db.query(fetchQuotationQuery, (err, result) => {
                if (err) {
                    console.error("❌ Database Error (Fetching Quotation ID):", err);
                    return reject("Database error.");
                }

                let nextQuotationId = "Qu001"; // Default if no valid quotation_id exists

                if (result.length > 0 && result[0].quotation_id) {
                    const lastQuotationId = result[0].quotation_id;
                    const match = lastQuotationId.match(/Qu00(\d+)/); // Extract number

                    if (match) {
                        let lastNumber = parseInt(match[1], 10); // Convert extracted number to integer
                        nextQuotationId = `Qu00${lastNumber + 1}`; // Increment for new ID
                    }
                }

                resolve(nextQuotationId);
            });
        });


        console.log("✅ Generated Quotation ID:", newQuotationId);
        
        // ✅ Nodemailer Configuration
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "iiiqbetsvarnaaz@gmail.com",
                pass: "rbdy vard mzit ybse",
            },
            tls: { rejectUnauthorized: false },
        });

        let mailOptions = {
            from: "iiiqbetsvarnaaz@gmail.com",
            to: email,
            subject: `Quotation #${newQuotationId}`,
            text: "Please find the attached quotation.",
            attachments: [{ filename: file.originalname, path: path.join(uploadDir, file.filename) }],
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully with attachment:", filePath);

        // ✅ Store Email Details in MySQL
        const insertQuery = `
    INSERT INTO emails (leadid, receiver_email, subject, \`text\`, file_path, type, email_sent, quotation_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

        const values = [leadid, email, mailOptions.subject, mailOptions.text, filePath, "sent", 1, newQuotationId];

        db.query(insertQuery, values, (err, result) => {
            if (err) {
                console.error("❌ Database Error (Inserting Email Record):", err);
                return res.status(500).json({ error: "Database insert error." });
            }

            console.log("✅ Email Record Saved with Quotation ID:", newQuotationId);

            // ✅ Update `quotation_id` in `travel_opportunity`
            const updateQuery = `
        UPDATE travel_opportunity 
        SET quotation_id = ? 
        WHERE leadid = ?
    `;

            db.query(updateQuery, [newQuotationId, leadid], (err, result) => {
                if (err) {
                    console.error("❌ Database Error (Updating Travel Opportunity):", err);
                    return res.status(500).json({ error: "Database update error." });
                }

                if (result.affectedRows > 0) {
                    console.log("✅ Quotation ID Updated in Travel Opportunity for LeadID:", leadid);
                } else {
                    console.log("⚠️ No Matching LeadID Found in Travel Opportunity.");
                }

                res.json({ message: "Quotation uploaded, email sent, and data updated successfully!" });
            });
        });
    } catch (error) {
        console.error("❌ Email Sending Error:", error);
        res.status(500).json({ error: "Error sending email." });
    }
}
);

// router.post("/upload-quotation", upload.single("file"), async (req, res) => {
//     const { email, leadid, sender_email } = req.body;
//     const file = req.file;

//     if (!file || !email || !leadid || !sender_email) {
//         return res.status(400).json({ error: "Missing file, email, leadid, or sender_email." });
//     }

//     const filePath = `/uploads/${file.filename}`;
//     console.log("📁 File stored at:", filePath);

//     try {
//         // ✅ Fetch specific logged-in sender credentials from DB
//         const sender = await new Promise((resolve, reject) => {
//             const query = "SELECT * FROM email_credentials WHERE sender_email = ?";
//             db.query(query, [sender_email], (err, results) => {
//                 if (err || results.length === 0) {
//                     console.error("❌ Error fetching sender credentials:", err || "No credentials found");
//                     return reject("Email credentials not found for logged-in user.");
//                 }
//                 resolve(results[0]); // { sender_email, app_password }
//             });
//         });

//         // ✅ Generate new Quotation ID
//         const newQuotationId = await new Promise((resolve, reject) => {
//             const fetchQuotationQuery = `
//                 SELECT quotation_id 
//                 FROM emails 
//                 WHERE quotation_id IS NOT NULL 
//                 ORDER BY id DESC 
//                 LIMIT 1
//             `;
//             db.query(fetchQuotationQuery, (err, result) => {
//                 if (err) return reject(err);

//                 let nextQuotationId = "Qu001";
//                 if (result.length > 0 && result[0].quotation_id) {
//                     const last = result[0].quotation_id.match(/Qu00(\d+)/);
//                     if (last) nextQuotationId = `Qu00${parseInt(last[1]) + 1}`;
//                 }
//                 resolve(nextQuotationId);
//             });
//         });

//         console.log("🧾 Generated Quotation ID:", newQuotationId);

//         // ✅ Create dynamic transporter
//         let transporter = nodemailer.createTransport({
//             service: "gmail",
//             auth: {
//                 user: sender.sender_email,
//                 pass: sender.app_password
//             },
//             tls: { rejectUnauthorized: false }
//         });

//         let mailOptions = {
//             from: sender.sender_email,
//             to: email,
//             subject: `Quotation #${newQuotationId}`,
//             text: "Please find the attached quotation.",
//             attachments: [
//                 {
//                     filename: file.originalname,
//                     path: path.join(uploadDir, file.filename)
//                 }
//             ]
//         };

//         await transporter.sendMail(mailOptions);
//         console.log("✅ Email sent successfully from:", sender.sender_email);

//         // ✅ Store in emails table
//         const insertQuery = `
//             INSERT INTO emails 
//             (leadid, receiver_email, subject, \`text\`, file_path, type, email_sent, quotation_id, sender_email) 
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;
//         const values = [leadid, email, mailOptions.subject, mailOptions.text, filePath, "sent", 1, newQuotationId, sender.sender_email];

//         db.query(insertQuery, values, (err) => {
//             if (err) {
//                 console.error("❌ Error saving email record:", err);
//                 return res.status(500).json({ error: "DB error saving email." });
//             }

//             // ✅ Update travel_opportunity
//             const updateQuery = `
//                 UPDATE travel_opportunity 
//                 SET quotation_id = ? 
//                 WHERE leadid = ?
//             `;
//             db.query(updateQuery, [newQuotationId, leadid], (err, result) => {
//                 if (err) {
//                     console.error("❌ Error updating travel_opportunity:", err);
//                     return res.status(500).json({ error: "DB error updating travel_opportunity." });
//                 }

//                 if (result.affectedRows > 0) {
//                     console.log("✅ Updated travel_opportunity with quotation_id:", newQuotationId);
//                 } else {
//                     console.warn("⚠️ No lead found to update.");
//                 }

//                 res.json({ message: "Quotation uploaded and email sent successfully!" });
//             });
//         });

//     } catch (error) {
//         console.error("❌ Failed to send quotation email:", error);
//         res.status(500).json({ error: "Error sending email." });
//     }
// });








// Get Email History by Email
router.get("/email-history", (req, res) => {
    const { leadid } = req.query;
    if (!leadid) {
        return res.status(400).json({ error: "Lead ID is required." });
    }

    const sql = "SELECT * FROM emails WHERE leadid = ? ORDER BY id DESC";
    db.query(sql, [leadid], (err, results) => {
        if (err) {
            console.error("Error fetching email history:", err);
            return res.status(500).json({ error: "Database error." });
        }
        res.json(results);
    });
});
// router.get("/email-history", (req, res) => {
//     const { leadid } = req.query;
//     if (!leadid) {
//         return res.status(400).json({ error: "Lead ID is required." });
//     }

//     // First, get all sent emails with the given leadid to find the associated email addresses
//     const getSentEmailsSql = "SELECT receiver_email FROM emails WHERE leadid = ? AND type = 'sent'";
    
//     db.query(getSentEmailsSql, [leadid], (err, sentEmails) => {
//         if (err) {
//             console.error("Error fetching sent emails:", err);
//             return res.status(500).json({ error: "Database error." });
//         }

//         if (sentEmails.length === 0) {
//             // If no sent emails found with this leadid, return empty array
//             return res.json([]);
//         }

//         // Extract all unique receiver emails from the sent emails
//         const receiverEmails = [...new Set(sentEmails.map(email => email.receiver_email))];

//         // Now find all emails where:
//         // 1. type is 'sent' and leadid matches, OR
//         // 2. type is 'received' and receiver_email matches any of the sent emails' receiver_email
//         const getEmailHistorySql = `
//             SELECT * FROM emails 
//             WHERE (type = 'sent' AND leadid = ?) 
//                OR (type = 'received' AND receiver_email IN (?))
//             ORDER BY id DESC
//         `;

//         db.query(getEmailHistorySql, [leadid, receiverEmails], (err, results) => {
//             if (err) {
//                 console.error("Error fetching email history:", err);
//                 return res.status(500).json({ error: "Database error." });
//             }
//             res.json(results);
//         });
//     });
// });

// In your Express route
// app.get('/api/received-mails/:leadid', (req, res) => {
//     const leadid = req.params.leadid;
//     const query = `
//       SELECT * FROM emails 
//       WHERE type = 'received' 
//       AND leadid = ?
//       ORDER BY created_at DESC
//     `;
  
//     db.query(query, [leadid], (err, results) => {
//       if (err) return res.status(500).json({ error: err });
//       res.json(results);
//     });
//   });
// router.get("/email-history", (req, res) => {
//     const { leadid } = req.query;
  
//     if (!leadid) {
//       return res.status(400).json({ error: "Lead ID is required." });
//     }
  
//     const getSentEmailsQuery = `
//       SELECT * FROM emails 
//       WHERE leadid = ? AND type = 'sent'
//       ORDER BY id DESC
//     `;
  
//     db.query(getSentEmailsQuery, [leadid], (err, sentResults) => {
//       if (err) {
//         console.error("Error fetching sent emails:", err);
//         return res.status(500).json({ error: "Database error." });
//       }
  
//       if (sentResults.length === 0) {
//         return res.json([]);
//       }
  
//       const lastSentEmail = sentResults[0];
//       const subject = lastSentEmail.subject || "";
//       const replySubjectLike = `Re: ${subject}`;
  
//       const getRepliesQuery = `
//         SELECT * FROM emails 
//         WHERE leadid = ? 
//           AND subject LIKE ? 
//           AND type = 'received'
//         ORDER BY id ASC
//       `;
  
//       db.query(getRepliesQuery, [leadid, `%${replySubjectLike}%`], (err, replyResults) => {
//         if (err) {
//           console.error("Error fetching replies:", err);
//           return res.status(500).json({ error: "Database error." });
//         }
  
//         const allMessages = [lastSentEmail, ...replyResults];
//         allMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
//         res.json(allMessages);
//       });
//     });
//   });
// Fetch email history for a specific leadid and subject
// Backend API to fetch email history based on leadid and subject
// router.get("/email-history", (req, res) => {
//     const { email, leadid } = req.query;
    
//     if (!email) {
//         return res.status(400).json({ error: "Email is required." });
//     }

//     // Query to get emails with derived leadid for received emails
//     const sql = `
//         SELECT e.*, 
//             CASE 
//                 WHEN e.type = 'received' THEN (
//                     SELECT s.leadid 
//                     FROM emails s 
//                     WHERE s.receiver_email = e.receiver_email 
//                     AND s.type = 'sent' 
//                     AND s.created_at <= e.created_at 
//                     ORDER BY s.created_at DESC 
//                     LIMIT 1
//                 )
//                 ELSE e.leadid
//             END AS derived_leadid
//         FROM emails e
//         WHERE e.receiver_email = ?
//         ${leadid ? 'HAVING derived_leadid = ?' : ''}
//         ORDER BY created_at DESC
//     `;

//     const params = leadid ? [email, leadid] : [email];

//     db.query(sql, params, (err, results) => {
//         if (err) {
//             console.error("Error fetching email history:", err);
//             return res.status(500).json({ error: "Database error." });
//         }
        
//         // Group by derived_leadid if no specific leadid was requested
//         if (!leadid) {
//             const grouped = {};
//             results.forEach(email => {
//                 const key = email.derived_leadid || 'no_leadid';
//                 if (!grouped[key]) {
//                     grouped[key] = [];
//                 }
//                 grouped[key].push(email);
//             });
//             return res.json(grouped);
//         }
        
//         res.json(results);
//     });
// });
// router.get("/email-history", (req, res) => {
//     const { email, leadid } = req.query;
    
//     if (!email) {
//         return res.status(400).json({ error: "Email is required." });
//     }

//     // Improved query to handle both sent and received emails
//     const sql = `
//         WITH email_threads AS (
//             SELECT 
//                 e.*,
//                 CASE 
//                     WHEN e.type = 'received' THEN (
//                         SELECT s.leadid 
//                         FROM emails s 
//                         WHERE s.receiver_email = e.receiver_email 
//                         AND s.type = 'sent'
//                         AND s.leadid IS NOT NULL
//                         AND s.created_at <= e.created_at 
//                         ORDER BY s.created_at DESC 
//                         LIMIT 1
//                     )
//                     ELSE e.leadid
//                 END AS thread_leadid,
//                 CASE
//                     WHEN e.type = 'received' THEN (
//                         SELECT s.id
//                         FROM emails s 
//                         WHERE s.receiver_email = e.receiver_email 
//                         AND s.type = 'sent'
//                         AND s.leadid IS NOT NULL
//                         AND s.created_at <= e.created_at 
//                         ORDER BY s.created_at DESC 
//                         LIMIT 1
//                     )
//                     ELSE e.id
//                 END AS thread_id
//             FROM emails e
//             WHERE e.receiver_email = ?
//             OR (e.sender_email = ? AND e.type = 'sent')
//         )
//         SELECT * FROM email_threads
//         ${leadid ? 'WHERE thread_leadid = ?' : ''}
//         ORDER BY created_at DESC
//     `;

//     const params = leadid ? [email, email, leadid] : [email, email];

//     db.query(sql, params, (err, results) => {
//         if (err) {
//             console.error("Error fetching email history:", err);
//             return res.status(500).json({ error: "Database error." });
//         }
        
//         // Group by thread_leadid if no specific leadid was requested
//         if (!leadid) {
//             const grouped = {};
//             results.forEach(email => {
//                 const key = email.thread_leadid || 'no_leadid';
//                 if (!grouped[key]) {
//                     grouped[key] = [];
//                 }
//                 grouped[key].push(email);
//             });
//             return res.json(grouped);
//         }
        
//         res.json(results);
//     });
// });

  
// Update email status using leadid
router.post("/update-email-status", (req, res) => {
    const { leadid } = req.body;
    if (!leadid) {
        return res.status(400).json({ success: false, message: "Lead ID is required" });
    }

    db.query("UPDATE travel_opportunity SET email_sent = 1 WHERE leadid = ?", [leadid], (error, results) => {
        if (error) {
            console.error("Database error:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
        res.status(200).json({ success: true, message: "Email status updated successfully" });
    });
});

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "iiiqbetsvarnaaz@gmail.com",
        pass: "rbdy vard mzit ybse",// Use App Password
    },
    tls: { rejectUnauthorized: false },
});





//   router.post("/post-from-email", upload.single("file"), async (req, res) => {
//     const { leadid, receiver_email, subject, text, type, reply_to_message_id } = req.body;
//     const file_path = req.file ? `/uploads/${req.file.filename}` : null;

//     if (!leadid || !receiver_email || !subject || !text || !type) {
//       return res.status(400).json({ error: "Missing required fields." });
//     }

//     try {
//       // Prepend "Re:" to the subject if it's a reply
//       const finalSubject = reply_to_message_id && !subject.startsWith("Re:") ? `Re: ${subject}` : subject;

//       // Format the email text for replies
//       let finalText = text;
//       if (reply_to_message_id) {
//         finalText = `
//   ---

//   **${receiver_email}**  
//   ${text}

//   ---

//   On ${new Date().toLocaleString()}, ${receiver_email} wrote:
//   > ${text}
//         `;
//       }

//       // Send Email
//       const mailOptions = {
//         from: "uppalahemanth4@gmail.com",
//         to: receiver_email,
//         subject: finalSubject,
//         text: finalText,
//         attachments: file_path ? [{ path: path.join(uploadDir, req.file.filename) }] : [],
//         headers: reply_to_message_id ? { 'In-Reply-To': reply_to_message_id, 'References': reply_to_message_id } : {},
//       };

//       const info = await transporter.sendMail(mailOptions);

//       // Save Email to Database
//       const sql = `
//         INSERT INTO emails (leadid, receiver_email, subject, text, file_path, type, email_sent, message_id) 
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//       `;
//       const values = [leadid, receiver_email, finalSubject, finalText, file_path, type, 1, info.messageId];

//       db.query(sql, values, (err, result) => {
//         if (err) {
//           console.error("Database Error (Inserting Email Record):", err);
//           return res.status(500).json({ error: "Database insert error." });
//         }

//         res.json({ message: "Email sent and stored successfully!", message_id: info.messageId });
//       });
//     } catch (error) {
//       console.error("Error sending email:", error);
//       res.status(500).json({ error: "Error sending email.", details: error.message });
//     }
//   });

//   router.post("/post-from-email", upload.single("file"), async (req, res) => {
//     const { leadid, receiver_email, subject, text, type, reply_to_message_id, is_plain_text } = req.body;
//     const file_path = req.file ? `/uploads/${req.file.filename}` : null;

//     if (!leadid || !receiver_email || !text || !type) {
//       return res.status(400).json({ error: "Missing required fields." });
//     }

//     try {
//       // Use exactly the text received - no formatting
//       const finalText = text;

//       const mailOptions = {
//         from: "uppalahemanth4@gmail.com",
//         to: receiver_email,
//         subject: subject,
//         text: finalText, // Plain text only
//         attachments: file_path ? [{ path: path.join(uploadDir, req.file.filename) }] : [],
//         // Only add threading headers if not a plain text message
//         headers: (!is_plain_text && reply_to_message_id) ? { 
//           'In-Reply-To': reply_to_message_id, 
//           'References': reply_to_message_id 
//         } : {}
//       };

//       const info = await transporter.sendMail(mailOptions);

//       const sql = `
//         INSERT INTO emails (leadid, receiver_email, subject, text, file_path, type, email_sent, message_id) 
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//       `;
//       const values = [leadid, receiver_email, subject, finalText, file_path, type, 1, info.messageId];

//       db.query(sql, values, (err, result) => {
//         if (err) {
//           console.error("Database Error:", err);
//           return res.status(500).json({ error: "Database error." });
//         }
//         res.json({ message: "Email sent successfully!", message_id: info.messageId });
//       });
//     } catch (error) {
//       console.error("Error sending email:", error);
//       res.status(500).json({ error: "Email sending failed." });
//     }
//   });


router.get("/latest-quotation", async (req, res) => {
    try {
        db.query(
            `SELECT quotation_id FROM emails WHERE quotation_id IS NOT NULL ORDER BY id DESC LIMIT 1`,
            (err, results) => {
                if (err) {
                    console.error("Database Error:", err);
                    return res.status(500).json({ error: "Database fetch error." });
                }

                let newQuotationId = "Qu001"; // Default if no valid quotation_id exists

                if (results.length > 0 && results[0].quotation_id) {
                    const lastQuotationId = results[0].quotation_id;
                    const lastNumber = parseInt(lastQuotationId.replace("Qu00", ""), 10);
                    newQuotationId = `Qu00${lastNumber + 1}`;
                }

                res.json({ quotation_id: newQuotationId });
            }
        );
    } catch (error) {
        console.error("Error fetching latest quotation:", error);
        res.status(500).json({ error: "Failed to fetch latest quotation." });
    }
});







// router.post("/post-from-email", upload.single("file"), async (req, res) => {
//   const {
//     leadid,
//     receiver_email,
//     subject,
//     text,
//     type,
//     reply_to_message_id,
//     is_plain_text,
//     quotation_id,
//     sender_email // 👈 Receive sender_email
//   } = req.body;

//   const file_path = req.file ? `/uploads/${req.file.filename}` : null;

//   if (!leadid || !receiver_email || (!text && !file_path) || !type || !sender_email) {
//     return res.status(400).json({ error: "Missing required fields." });
//   }

//   try {
//     // 👇 Fetch login user credentials from DB (assuming you store email and app_password)
//     const [user] = await new Promise((resolve, reject) => {
//       db.query(
//         `SELECT email, app_password FROM users WHERE email = ? LIMIT 1`,
//         [sender_email],
//         (err, result) => {
//           if (err) reject(err);
//           else resolve(result);
//         }
//       );
//     });

//     if (!user) {
//       return res.status(403).json({ error: "Invalid sender email." });
//     }

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: user.email,
//         pass: user.app_password // stored app password for Gmail
//       },
//       tls: { rejectUnauthorized: false }
//     });

//     let newQuotationId = quotation_id;

//     if (!newQuotationId && file_path) {
//       const quotationResult = await new Promise((resolve, reject) => {
//         db.query(
//           `SELECT quotation_id FROM emails WHERE quotation_id IS NOT NULL ORDER BY id DESC LIMIT 1`,
//           (err, results) => {
//             if (err) reject(err);
//             else resolve(results);
//           }
//         );
//       });

//       if (quotationResult.length > 0 && quotationResult[0].quotation_id) {
//         const lastQuotationId = quotationResult[0].quotation_id;
//         const lastNumber = parseInt(lastQuotationId.replace("Qu00", ""), 10);
//         newQuotationId = `Qu00${lastNumber + 1}`;
//       } else {
//         newQuotationId = "Qu001";
//       }
//     }

//     const mailOptions = {
//       from: user.email,
//       to: receiver_email,
//       subject: subject,
//       text: text || "",
//       attachments: file_path ? [{ path: path.join(uploadDir, req.file.filename) }] : [],
//       headers: (!is_plain_text && reply_to_message_id)
//         ? { 'In-Reply-To': reply_to_message_id, 'References': reply_to_message_id }
//         : {}
//     };

//     const info = await transporter.sendMail(mailOptions);

//     const sql = `
//       INSERT INTO emails (leadid, receiver_email, subject, text, file_path, type, email_sent, message_id, quotation_id, sender_email) 
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;
//     const values = [
//       leadid,
//       receiver_email,
//       subject,
//       text || "",
//       file_path,
//       type,
//       1,
//       info.messageId,
//       newQuotationId,
//       sender_email
//     ];

//     db.query(sql, values, (err, result) => {
//       if (err) {
//         console.error("Database Error:", err);
//         return res.status(500).json({ error: "Database error." });
//       }

//       const updateQuery = `UPDATE travel_opportunity SET quotation_id = ? WHERE leadid = ?`;
//       db.query(updateQuery, [newQuotationId, leadid], (updateErr, updateResult) => {
//         if (updateErr) {
//           console.error("Error updating travel_opportunity:", updateErr);
//           return res.status(500).json({ error: "Failed to update quotation_id in travel_opportunity." });
//         }

//         res.json({
//           message: "Email sent successfully!",
//           message_id: info.messageId,
//           quotation_id: newQuotationId
//         });
//       });
//     });

//   } catch (error) {
//     console.error("Error sending email:", error);
//     res.status(500).json({ error: "Email sending failed." });
//   }
// });


// router.post("/post-from-email", upload.single("file"), async (req, res) => {
//     const {
//       leadid,
//       receiver_email,
//       subject,
//       text,
//       type,
//       reply_to_message_id,
//       is_plain_text,
//       quotation_id,
//       sender_email,
//     } = req.body;
  
//     const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  
//     console.log("REQ BODY:", req.body);
//     console.log("REQ FILE:", req.file);
  
//     if (!leadid || !receiver_email || (!text && !file_path) || !type || !sender_email) {
//       return res.status(400).json({ error: "Missing required fields." });
//     }
  
//     try {
//       // 🧠 Get sender's email credentials
//       const [credentials] = await new Promise((resolve, reject) => {
//         db.query(
//           `SELECT sender_email, app_password FROM email_credentials WHERE sender_email = ? LIMIT 1`,
//           [sender_email],
//           (err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//           }
//         );
//       });
  
//       console.log("Fetched credentials:", credentials);
  
//       if (!credentials) {
//         return res.status(403).json({ error: "Invalid sender email or credentials not found." });
//       }
  
//       // 📧 Setup Nodemailer transport
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: credentials.sender_email,
//           pass: credentials.app_password,
//         },
//         tls: { rejectUnauthorized: false },
//       });
  
//       let newQuotationId = quotation_id;
  
//       // 🔢 Generate new quotation ID if not passed
//       if (!newQuotationId && file_path) {
//         const quotationResult = await new Promise((resolve, reject) => {
//           db.query(
//             `SELECT quotation_id FROM emails WHERE quotation_id IS NOT NULL ORDER BY id DESC LIMIT 1`,
//             (err, results) => {
//               if (err) reject(err);
//               else resolve(results);
//             }
//           );
//         });
  
//         if (quotationResult.length > 0 && quotationResult[0].quotation_id) {
//           const lastNumber = parseInt(quotationResult[0].quotation_id.replace("Qu00", ""), 10);
//           newQuotationId = `Qu00${lastNumber + 1}`;
//         } else {
//           newQuotationId = "Qu001";
//         }
//       }
  
//       console.log("New Quotation ID:", newQuotationId);
  
//       // ✉️ Email options
//       const mailOptions = {
//         from: credentials.sender_email,
//         to: receiver_email,
//         subject: subject,
//         text: text || "",
//         attachments: file_path ? [{ path: path.join(uploadDir, req.file.filename) }] : [],
//         headers:
//           !is_plain_text && reply_to_message_id
//             ? { "In-Reply-To": reply_to_message_id, References: reply_to_message_id }
//             : {},
//       };
  
//       let info;
//       try {
//         info = await transporter.sendMail(mailOptions);
//         console.log("SMTP Info:", info);
//       } catch (smtpErr) {
//         console.error("SMTP Error:", smtpErr);
//         return res.status(500).json({ error: "Failed to send via SMTP", details: smtpErr.message });
//       }
  
//       // 💾 Save email to DB
//       const sql = `
//         INSERT INTO emails (leadid, receiver_email, subject, text, file_path, type, email_sent, message_id, quotation_id, sender_email)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
  
//       const values = [
//         leadid,
//         receiver_email,
//         subject,
//         text || "",
//         file_path,
//         type,
//         1,
//         info.messageId,
//         newQuotationId,
//         sender_email,
//       ];
  
//       db.query(sql, values, (err, result) => {
//         if (err) {
//           console.error("Database Error:", err);
//           return res.status(500).json({ error: "Database error." });
//         }
  
//         // 🔄 Update travel_opportunity with quotation_id
//         db.query(
//           `UPDATE travel_opportunity SET quotation_id = ? WHERE leadid = ?`,
//           [newQuotationId, leadid],
//           (updateErr, updateResult) => {
//             if (updateErr) {
//               console.error("Error updating quotation_id:", updateErr);
//               return res.status(500).json({ error: "Failed to update quotation_id." });
//             }
  
//             res.json({
//               message: "Email sent successfully!",
//               message_id: info.messageId,
//               quotation_id: newQuotationId,
//             });
//           }
//         );
//       });
//     } catch (error) {
//       console.error("Unhandled Server Error:", error);
//       res.status(500).json({ error: "Internal server error", details: error.message });
//     }
//   });
  
  
// router.post("/post-from-email", upload.single("file"), async (req, res) => {
//     const {
//       leadid,
//       receiver_email,
//       subject,
//       text,
//       type,
//       reply_to_message_id,
//       is_plain_text,
//       quotation_id,
//       sender_email,
//     } = req.body;
  
//     const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  
//     console.log("REQ BODY:", req.body);
//     console.log("REQ FILE:", req.file);
  
//     if (!leadid || !receiver_email || (!text && !file_path) || !type || !sender_email) {
//       return res.status(400).json({ error: "Missing required fields." });
//     }
  
//     try {
//       // ✅ Fetch sender's credentials
//       const [credentials] = await new Promise((resolve, reject) => {
//         db.query(
//           `SELECT sender_email, app_password FROM email_credentials WHERE sender_email = ? LIMIT 1`,
//           [sender_email],
//           (err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//           }
//         );
//       });
  
//       if (!credentials) {
//         return res.status(403).json({ error: "Invalid sender email or credentials not found." });
//       }
  
//       // ✅ Setup transporter
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: credentials.sender_email,
//           pass: credentials.app_password,
//         },
//         tls: { rejectUnauthorized: false },
//       });
  
//       // ✅ Generate new quotation_id if needed
//       let newQuotationId = quotation_id;
//       if (!newQuotationId && file_path) {
//         const latestQuotation = await new Promise((resolve, reject) => {
//           db.query(
//             `SELECT quotation_id FROM emails WHERE quotation_id IS NOT NULL ORDER BY id DESC LIMIT 1`,
//             (err, results) => {
//               if (err) reject(err);
//               else resolve(results);
//             }
//           );
//         });
  
//         if (latestQuotation.length > 0 && latestQuotation[0].quotation_id) {
//           const lastNum = parseInt(latestQuotation[0].quotation_id.replace("Qu00", ""), 10);
//           newQuotationId = `Qu00${lastNum + 1}`;
//         } else {
//           newQuotationId = "Qu001";
//         }
//       }
  
//       // ✅ Email options
//       const mailOptions = {
//         from: credentials.sender_email,
//         to: receiver_email,
//         subject: subject,
//         // 👇 send HTML if it's not plain text
//         ...(is_plain_text === "true"
//           ? { text: text || "" }
//           : { html: text || "" }),
//         attachments: file_path ? [{ path: path.join(uploadDir, req.file.filename) }] : [],
//         headers: (!is_plain_text && reply_to_message_id)
//           ? { "In-Reply-To": reply_to_message_id, References: reply_to_message_id }
//           : {},
//       };
      
      
  
//       // ✅ Send Email
//       let info;
//       try {
//         info = await transporter.sendMail(mailOptions);
//         console.log("Email sent:", info.messageId);
//       } catch (smtpErr) {
//         console.error("SMTP Error:", smtpErr);
//         return res.status(500).json({ error: "Failed to send via SMTP", details: smtpErr.message });
//       }
  
//       // ✅ Save to DB
//       const insertQuery = `
//         INSERT INTO emails (
//           leadid, receiver_email, subject, text, file_path, type,
//           email_sent, message_id, quotation_id, sender_email
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
  
//       const insertValues = [
//         leadid,
//         receiver_email,
//         subject,
//         text || "",
//         file_path,
//         type,
//         1,
//         info.messageId,
//         newQuotationId,
//         sender_email,
//       ];
  
//       db.query(insertQuery, insertValues, (err, result) => {
//         if (err) {
//           console.error("DB Insert Error:", err);
//           return res.status(500).json({ error: "Database error while inserting email." });
//         }
  
//         // ✅ Update quotation_id in travel_opportunity
//         db.query(
//           `UPDATE travel_opportunity SET quotation_id = ? WHERE leadid = ?`,
//           [newQuotationId, leadid],
//           (updateErr) => {
//             if (updateErr) {
//               console.error("Update Quotation Error:", updateErr);
//               return res.status(500).json({ error: "Failed to update quotation_id." });
//             }
  
//             res.json({
//               message: "Email sent and saved successfully!",
//               message_id: info.messageId,
//               quotation_id: newQuotationId,
//             });
//           }
//         );
//       });
//     } catch (error) {
//       console.error("Server Error:", error);
//       res.status(500).json({ error: "Internal server error", details: error.message });
//     }
//   });

//---working-->
// router.post("/post-from-email", upload.single("file"), async (req, res) => {
//     const {
//       leadid,
//       receiver_email,
//       subject,
//       text,
//       type,
//       reply_to_message_id,
//       is_plain_text,
//       quotation_id,
//       sender_email,
//     } = req.body;
  
//     const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  
//     console.log("REQ BODY:", req.body);
//     console.log("REQ FILE:", req.file);
  
//     if (!leadid || !receiver_email || (!text && !file_path) || !type || !sender_email) {
//       return res.status(400).json({ error: "Missing required fields." });
//     }
  
//     try {
//       // ✅ Fetch sender's credentials
//       const [credentials] = await new Promise((resolve, reject) => {
//         db.query(
//           `SELECT sender_email, app_password FROM email_credentials WHERE sender_email = ? LIMIT 1`,
//           [sender_email],
//           (err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//           }
//         );
//       });
  
//       if (!credentials) {
//         return res.status(403).json({ error: "Invalid sender email or credentials not found." });
//       }
  
//       // ✅ Dynamically set transporter
//       let transporter;
//       if (credentials.sender_email.endsWith("@iiiqai.com")) {
//         transporter = nodemailer.createTransport({
//           host: "smtp.titan.email",
//           port: 465,
//           secure: true,
//           auth: {
//             user: credentials.sender_email,
//             pass: credentials.app_password,
//           },
//         });
//       } else {
//         transporter = nodemailer.createTransport({
//           service: "gmail",
//           auth: {
//             user: credentials.sender_email,
//             pass: credentials.app_password,
//           },
//           tls: { rejectUnauthorized: false },
//         });
//       }
  
//       // ✅ Generate new quotation_id if needed
//       let newQuotationId = quotation_id;
//       if (!newQuotationId && file_path) {
//         const latestQuotation = await new Promise((resolve, reject) => {
//           db.query(
//             `SELECT quotation_id FROM emails WHERE quotation_id IS NOT NULL ORDER BY id DESC LIMIT 1`,
//             (err, results) => {
//               if (err) reject(err);
//               else resolve(results);
//             }
//           );
//         });
  
//         if (latestQuotation.length > 0 && latestQuotation[0].quotation_id) {
//           const lastNum = parseInt(latestQuotation[0].quotation_id.replace("Qu00", ""), 10);
//           newQuotationId = `Qu00${lastNum + 1}`;
//         } else {
//           newQuotationId = "Qu001";
//         }
//       }
  
//       // ✅ Email options
//       const mailOptions = {
//         from: credentials.sender_email,
//         to: receiver_email,
//         subject: subject,
//         ...(is_plain_text === "true" ? { text: text || "" } : { html: text || "" }),
//         attachments: file_path ? [{ path: path.join(uploadDir, req.file.filename) }] : [],
//         headers:
//           !is_plain_text && reply_to_message_id
//             ? { "In-Reply-To": reply_to_message_id, References: reply_to_message_id }
//             : {},
//       };
  
//       // ✅ Send Email
//       let info;
//       try {
//         info = await transporter.sendMail(mailOptions);
//         console.log("Email sent:", info.messageId);
//       } catch (smtpErr) {
//         console.error("SMTP Error:", smtpErr);
//         return res.status(500).json({ error: "Failed to send via SMTP", details: smtpErr.message });
//       }
  
//       // ✅ Save to DB
//       const insertQuery = `
//         INSERT INTO emails (
//           leadid, receiver_email, subject, text, file_path, type,
//           email_sent, message_id, quotation_id, sender_email
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
  
//       const insertValues = [
//         leadid,
//         receiver_email,
//         subject,
//         text || "",
//         file_path,
//         type,
//         1,
//         info.messageId,
//         newQuotationId,
//         sender_email,
//       ];
  
//       db.query(insertQuery, insertValues, (err, result) => {
//         if (err) {
//           console.error("DB Insert Error:", err);
//           return res.status(500).json({ error: "Database error while inserting email." });
//         }
  
//         // ✅ Update quotation_id in travel_opportunity
//         db.query(
//           `UPDATE travel_opportunity SET quotation_id = ? WHERE leadid = ?`,
//           [newQuotationId, leadid],
//           (updateErr) => {
//             if (updateErr) {
//               console.error("Update Quotation Error:", updateErr);
//               return res.status(500).json({ error: "Failed to update quotation_id." });
//             }
  
//             res.json({
//               message: "Email sent and saved successfully!",
//               message_id: info.messageId,
//               quotation_id: newQuotationId,
//             });
//           }
//         );
//       });
//     } catch (error) {
//       console.error("Server Error:", error);
//       res.status(500).json({ error: "Internal server error", details: error.message });
//     }
//   });

router.post("/send-bulk-emails", upload.single("file"), async (req, res) => {
    const {
      leadid,
      subject,
      text,
      type,
      is_plain_text,
      sender_email,
    } = req.body;
  
    const receiver_emails = JSON.parse(req.body.receiver_emails || "[]");
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  
    if (!leadid || receiver_emails.length === 0 || (!text && !file_path) || !type || !sender_email) {
      return res.status(400).json({ error: "Missing required fields." });
    }
  
    try {
      const [credentials] = await new Promise((resolve, reject) => {
        db.query(
          `SELECT sender_email, app_password FROM email_credentials WHERE sender_email = ? LIMIT 1`,
          [sender_email],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
  
      if (!credentials) {
        return res.status(403).json({ error: "Invalid sender email or credentials not found." });
      }
  
      let transporter = credentials.sender_email.endsWith("@iiiqai.com")
        ? nodemailer.createTransport({
            host: "smtp.titan.email",
            port: 465,
            secure: true,
            auth: { user: credentials.sender_email, pass: credentials.app_password },
            tls: { rejectUnauthorized: false },
          })
        : nodemailer.createTransport({
            service: "gmail",
            auth: { user: credentials.sender_email, pass: credentials.app_password },
            tls: { rejectUnauthorized: false },
          });
  
      const results = [];
  
      for (const receiver_email of receiver_emails) {
        const mailOptions = {
          from: credentials.sender_email,
          to: receiver_email,
          subject: subject,
          ...(is_plain_text === "true" ? { text: text } : { html: text }),
          attachments: file_path ? [{ path: path.join(uploadDir, req.file.filename) }] : [],
        };
  
        try {
          const info = await transporter.sendMail(mailOptions);
          console.log(`Email sent to ${receiver_email}: ${info.messageId}`);
  
          // Insert into DB
          await new Promise((resolve, reject) => {
            db.query(
              `INSERT INTO emails (leadid, receiver_email, subject, text, file_path, type, email_sent, message_id, sender_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [leadid, receiver_email, subject, text || "", file_path, type, 1, info.messageId, sender_email],
              (err, result) => (err ? reject(err) : resolve(result))
            );
          });
  
          results.push({ email: receiver_email, success: true });
        } catch (err) {
          console.error(`Failed to send email to ${receiver_email}`, err);
          results.push({ email: receiver_email, success: false, error: err.message });
        }
      }
  
      res.json({ message: "Bulk email sending complete", results });
    } catch (error) {
      console.error("Bulk Send Error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  });
  








module.exports = router;
