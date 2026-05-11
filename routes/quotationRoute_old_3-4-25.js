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
const imapConfig = {
    user: 'uppalahemanth4@gmail.com', // Replace with your admin email
    password: 'oimoftsgtwradkux', // Replace with your app password
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 30000,
};

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

const fetchAndStoreEmails = async () => {
    return new Promise((resolve, reject) => {
        // Get all known receiver emails
        db.query('SELECT DISTINCT receiver_email FROM emails', (err, receivers) => {
            if (err) return reject(err);

            const knownReceivers = new Set(receivers.map(r => r.receiver_email.toLowerCase().trim()));
            const imap = new Imap(imapConfig);

            imap.once('ready', () => {
                imap.openBox('INBOX', false, (err) => {
                    if (err) return reject(err);

                    // Search for today's emails
                    const date = new Date().toLocaleString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    }).replace(',', '');

                    imap.search([['ON', date]], (err, uids) => {
                        if (err) return reject(err);
                        if (!uids.length) return resolve('No new emails');

                        const fetch = imap.fetch(uids, { bodies: '' });
                        let processedCount = 0;

                        fetch.on('message', (msg) => {
                            let emailData = {};

                            msg.on('body', (stream) => {
                                simpleParser(stream, (err, parsed) => {
                                    if (err) return console.error('Parse error:', err);

                                    // Extract sender email
                                    const sender = parsed.from?.value?.[0]?.address;
                                    if (!sender || !knownReceivers.has(sender.toLowerCase().trim())) {
                                        return; // Skip unknown senders
                                    }

                                    // Get clean plain text content
                                    let cleanText = '';
                                    if (parsed.text) {
                                        cleanText = parsed.text
                                            .replace(/\r\n/g, '\n')
                                            .replace(/\t/g, '    ');
                                    } else if (parsed.html) {
                                        cleanText = parsed.html
                                            .replace(/<br\s*\/?>/gi, '\n')
                                            .replace(/<\/p>/gi, '\n\n')
                                            .replace(/<[^>]+>/g, '')
                                            .replace(/&nbsp;/g, ' ')
                                            .replace(/ +/g, ' ')
                                            .trim();
                                    }

                                    emailData = {
                                        message_id: parsed.messageId,
                                        receiver_email: sender,
                                        subject: parsed.subject || '(No subject)',
                                        text: cleanText || '[No text content]',
                                        type: 'received'
                                    };

                                    // Check if email exists
                                    db.query(
                                        'SELECT COUNT(*) AS count FROM emails WHERE message_id = ?',
                                        [emailData.message_id],
                                        (err, result) => {
                                            if (err) return console.error('DB check error:', err);

                                            if (result[0].count === 0) {
                                                // First store in emails table
                                                db.query(
                                                    'INSERT INTO emails SET ?',
                                                    emailData,
                                                    (err) => {
                                                        if (err) {
                                                            console.error('Store error:', err);
                                                        } else {
                                                            console.log('Stored email:', {
                                                                from: emailData.receiver_email,
                                                                subject: emailData.subject,
                                                                textLength: emailData.text.length
                                                            });

                                                            // Now find the lead ID from previous sent emails
                                                            db.query(
                                                                `SELECT leadid FROM emails 
                                                                 WHERE receiver_email = ? 
                                                                 AND type = 'sent' 
                                                                 ORDER BY created_at DESC 
                                                                 LIMIT 1`,
                                                                [emailData.receiver_email],
                                                                (err, sentEmails) => {
                                                                    if (err) {
                                                                        console.error('Error finding lead ID:', err);
                                                                        return;
                                                                    }

                                                                    if (sentEmails.length > 0) {
                                                                        const leadId = sentEmails[0].leadid;
                                                                        // Store in email_notifications table
                                                                        const notificationData = {
                                                                            leadid: leadId,
                                                                            email: emailData.receiver_email,
                                                                            subject: emailData.subject,
                                                                            text: emailData.text,
                                                                            created_at: new Date()
                                                                        };

                                                                        db.query(
                                                                            'INSERT INTO email_notifications SET ?',
                                                                            notificationData,
                                                                            (err) => {
                                                                                if (err) {
                                                                                    console.error('Error storing notification:', err);
                                                                                } else {
                                                                                    console.log('Stored notification for lead:', leadId);
                                                                                }
                                                                                processedCount++;
                                                                                if (processedCount === uids.length) {
                                                                                    imap.end();
                                                                                }
                                                                            }
                                                                        );
                                                                    } else {
                                                                        console.log('No matching sent email found for:', emailData.receiver_email);
                                                                        processedCount++;
                                                                        if (processedCount === uids.length) {
                                                                            imap.end();
                                                                        }
                                                                    }
                                                                }
                                                            );
                                                        }
                                                    }
                                                );
                                            } else {
                                                processedCount++;
                                                if (processedCount === uids.length) {
                                                    imap.end();
                                                }
                                            }
                                        }
                                    );
                                });
                            });
                        });

                        fetch.once('end', () => {
                            if (processedCount === uids.length) {
                                imap.end();
                            }
                            resolve('Processing completed');
                        });

                        fetch.once('error', reject);
                    });
                });
            });

            imap.once('error', reject);
            imap.connect();
        });
    });
};

// Automatically Fetch Emails Every 5 Minutes
setInterval(() => {
    console.log('Checking for new emails...');
    fetchAndStoreEmails().catch((err) => console.error('Error in automatic email fetching:', err));
}, 100000); // 5 minutes



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
                user: "uppalahemanth4@gmail.com",
                pass: "oimoftsgtwradkux",
            },
            tls: { rejectUnauthorized: false },
        });

        let mailOptions = {
            from: "uppalahemanth4@gmail.com",
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








// Get Email History by Email
router.get("/email-history", (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    const sql = "SELECT * FROM emails WHERE receiver_email = ? ORDER BY id DESC";
    db.query(sql, [email, email], (err, results) => {
        if (err) {
            console.error("Error fetching email history:", err);
            return res.status(500).json({ error: "Database error." });
        }
        res.json(results);
    });
});

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
        user: "uppalahemanth4@gmail.com", // Your Gmail
        pass: "oimoftsgtwradkux", // Use App Password
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



router.post("/post-from-email", upload.single("file"), async (req, res) => {
    const { leadid, receiver_email, subject, text, type, reply_to_message_id, is_plain_text, quotation_id } = req.body;
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;

    if (!leadid || !receiver_email || (!text && !file_path) || !type) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        let newQuotationId = quotation_id; // Use provided quotation_id if available

        if (!newQuotationId && file_path) {
            // Fetch latest valid quotation_id
            const quotationResult = await new Promise((resolve, reject) => {
                db.query(
                    `SELECT quotation_id FROM emails WHERE quotation_id IS NOT NULL ORDER BY id DESC LIMIT 1`,
                    (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    }
                );
            });

            if (quotationResult.length > 0 && quotationResult[0].quotation_id) {
                const lastQuotationId = quotationResult[0].quotation_id;
                const lastNumber = parseInt(lastQuotationId.replace("Qu00", ""), 10);
                newQuotationId = `Qu00${lastNumber + 1}`;
            } else {
                newQuotationId = "Qu001";
            }
        }

        const mailOptions = {
            from: "uppalahemanth4@gmail.com",
            to: receiver_email,
            subject: subject,
            text: text || "",
            attachments: file_path ? [{ path: path.join(uploadDir, req.file.filename) }] : [],
            headers: (!is_plain_text && reply_to_message_id) ? {
                'In-Reply-To': reply_to_message_id,
                'References': reply_to_message_id
            } : {}
        };

        const info = await transporter.sendMail(mailOptions);

        const sql = `
            INSERT INTO emails (leadid, receiver_email, subject, text, file_path, type, email_sent, message_id, quotation_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            leadid,
            receiver_email,
            subject,
            text || "",
            file_path,
            type,
            1,
            info.messageId,
            newQuotationId
        ];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ error: "Database error." });
            }

            // ✅ Update `quotation_id` in `travel_opportunity` where `leadid` matches
            const updateQuery = `UPDATE travel_opportunity SET quotation_id = ? WHERE leadid = ?`;
            db.query(updateQuery, [newQuotationId, leadid], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating travel_opportunity:", updateErr);
                    return res.status(500).json({ error: "Failed to update quotation_id in travel_opportunity." });
                }

                res.json({
                    message: "Email sent successfully!",
                    message_id: info.messageId,
                    quotation_id: newQuotationId
                });
            });
        });

    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Email sending failed." });
    }
});











module.exports = router;
