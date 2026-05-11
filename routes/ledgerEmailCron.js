require("dotenv").config();
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const db = require("../config/db");

console.log("📦 MySQL Auto Backup System Started");

// 📁 Create backupDB folder
const backupFolder = path.join(__dirname, "backupDB");

if (!fs.existsSync(backupFolder)) {
  fs.mkdirSync(backupFolder, { recursive: true });
  console.log("📁 backupDB folder created");
}

// 📧 Email Config
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // IMPORTANT: false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
// Check email connection
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ Email Config Error:", error);
  } else {
    console.log("✅ Email Server Ready");
  }
});

const archiver = require("archiver");

// ⏰ Every 2 Minutes
// cron.schedule("*/2 * * * *", async () => {
//   console.log("======================================");
//   console.log("⏰ Backup Process Started:", new Date().toLocaleString());
//   console.log("======================================");

//   // 📅 Proper Date-Time Format
//   const now = new Date();
//   const formattedDate =
//     now.getFullYear() +
//     "-" +
//     String(now.getMonth() + 1).padStart(2, "0") +
//     "-" +
//     String(now.getDate()).padStart(2, "0") +
//     "_" +
//     String(now.getHours()).padStart(2, "0") +
//     "-" +
//     String(now.getMinutes()).padStart(2, "0") +
//     "-" +
//     String(now.getSeconds()).padStart(2, "0");

//   const sqlFileName = `funstay_backup_${formattedDate}.sql`;
//   const zipFileName = `funstay_backup_${formattedDate}.zip`;

//   const sqlPath = path.join(backupFolder, sqlFileName);
//   const zipPath = path.join(backupFolder, zipFileName);

//   try {
//     let sqlDump = "";

//     const [tables] = await db.promise().query("SHOW TABLES");
//     console.log("📊 Total Tables Found:", tables.length);

//     for (let tableObj of tables) {
//       const tableName = Object.values(tableObj)[0];
//       console.log("📁 Processing Table:", tableName);

//       const [createTable] = await db
//         .promise()
//         .query(`SHOW CREATE TABLE \`${tableName}\``);

//       sqlDump += `\n\n${createTable[0]["Create Table"]};\n\n`;

//       const [rows] = await db
//         .promise()
//         .query(`SELECT * FROM \`${tableName}\``);

//       console.log(`   ↳ Rows Found: ${rows.length}`);

//       for (let row of rows) {
//         const columns = Object.keys(row)
//           .map((col) => `\`${col}\``)
//           .join(", ");

//         const values = Object.values(row)
//           .map((val) =>
//             val === null
//               ? "NULL"
//               : `'${val.toString().replace(/'/g, "\\'")}'`
//           )
//           .join(", ");

//         sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
//       }
//     }

//     // ✅ Save SQL File
//     fs.writeFileSync(sqlPath, sqlDump);

//     console.log("✅ SQL File Created:", sqlFileName);

//     // ✅ Create ZIP File
//     const output = fs.createWriteStream(zipPath);
//     const archive = archiver("zip", { zlib: { level: 9 } });

//     archive.pipe(output);
//     archive.file(sqlPath, { name: sqlFileName });
//     await archive.finalize();

//     // Wait for ZIP to finish writing
//     await new Promise((resolve) => output.on("close", resolve));

//     // 📦 ZIP Size
//     const stats = fs.statSync(zipPath);
//     const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

//     console.log("📦 ZIP Created:", zipFileName);
//     console.log("📦 ZIP Size:", fileSizeMB + " MB");
//     console.log("📍 ZIP Location:", zipPath);

//     // ✅ Send ZIP Email
//     const info = await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: process.env.RECEIVER_EMAIL,
//       subject: "Automatic MySQL Database Backup (Zipped)",
//       text: "Zipped database backup attached.",
//       attachments: [{ filename: zipFileName, path: zipPath }],
//     });

//     console.log("✅ Email Sent Successfully");
//     console.log("📧 Message ID:", info.messageId);
//     console.log("📨 Sent To:", process.env.RECEIVER_EMAIL);
//     console.log("======================================\n");

//   } catch (error) {
//     console.log("❌ ERROR DURING BACKUP OR EMAIL");
//     console.error(error);
//     console.log("======================================\n");
//   }
// });

cron.schedule("0 0 17 * * 0", async () => {
      console.log("======================================");
  console.log("⏰ Backup Process Started:", new Date().toLocaleString());
  console.log("======================================");

  const now = new Date();
  const formattedDate =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0") +
    "_" +
    String(now.getHours()).padStart(2, "0") +
    "-" +
    String(now.getMinutes()).padStart(2, "0") +
    "-" +
    String(now.getSeconds()).padStart(2, "0");

  const sqlFileName = `funstay_backup_${formattedDate}.sql`;
  const zipFileName = `funstay_backup_${formattedDate}.zip`;

  try {
    let sqlDump = "";

    const [tables] = await db.promise().query("SHOW TABLES");
    console.log("📊 Total Tables Found:", tables.length);

    for (let tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      console.log("📁 Processing Table:", tableName);

      const [createTable] = await db
        .promise()
        .query(`SHOW CREATE TABLE \`${tableName}\``);

      sqlDump += `\n\n${createTable[0]["Create Table"]};\n\n`;

      const [rows] = await db
        .promise()
        .query(`SELECT * FROM \`${tableName}\``);

      console.log(`   ↳ Rows Found: ${rows.length}`);

      for (let row of rows) {
        const columns = Object.keys(row)
          .map((col) => `\`${col}\``)
          .join(", ");

        const values = Object.values(row)
          .map((val) =>
            val === null
              ? "NULL"
              : `'${val.toString().replace(/'/g, "\\'")}'`
          )
          .join(", ");

        sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
      }
    }

    // ✅ Create ZIP in memory
    const archiver = require("archiver");
    const { PassThrough } = require("stream");
    const zipStream = new PassThrough();

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(zipStream);
    archive.append(sqlDump, { name: sqlFileName });
    archive.finalize();

    // Convert ZIP stream to buffer
    const chunks = [];
    zipStream.on("data", (chunk) => chunks.push(chunk));

    await new Promise((resolve, reject) => {
      zipStream.on("end", resolve);
      zipStream.on("finish", resolve);
      zipStream.on("error", reject);
    });

    const zipBuffer = Buffer.concat(chunks);

    console.log("📦 ZIP Prepared in memory");

    // ✅ Send Email with ZIP attachment
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVER_EMAIL,
      subject: "Automatic MySQL Database Backup (Zipped)",
      text: "Zipped database backup attached.",
      attachments: [{ filename: zipFileName, content: zipBuffer }],
    });

    console.log("✅ Email Sent Successfully");
    console.log("📧 Message ID:", info.messageId);
    console.log("📨 Sent To:", process.env.RECEIVER_EMAIL);
    console.log("======================================\n");

  } catch (error) {
    console.log("❌ ERROR DURING BACKUP OR EMAIL");
    console.error(error);
    console.log("======================================\n");
  }
});