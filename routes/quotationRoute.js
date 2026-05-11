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
                                    // Inside the simpleParser callback:
                                    let cleanText = '';
                                    if (parsed.text) {
                                        // Preserve original formatting
                                        cleanText = parsed.text
                                            .replace(/\r\n/g, '\n')  // Normalize line endings
                                            .replace(/\t/g, '    '); // Convert tabs to spaces
                                    } else if (parsed.html) {
                                        // Convert HTML to plain text while preserving some formatting
                                        cleanText = parsed.html
                                            .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newlines
                                            .replace(/<\/p>/gi, '\n\n')     // Convert paragraph ends to double newlines
                                            .replace(/<[^>]+>/g, '')        // Remove all other HTML tags
                                            .replace(/&nbsp;/g, ' ')        // Convert non-breaking spaces
                                            .replace(/ +/g, ' ')            // Collapse multiple spaces
                                            .trim();
                                    }

                                    // Then store in emailData:
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
                                                // Store in database
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
                                                        }
                                                    }
                                                );
                                            }
                                        }
                                    );
                                });
                            });
                        });

                        fetch.once('end', () => {
                            imap.end();
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
