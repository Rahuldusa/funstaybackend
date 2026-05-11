const cron = require("node-cron");
const nodemailer = require("nodemailer");
const mysql = require("mysql2/promise");
const axios = require("axios");

// Database Configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "funstay",
};

// Email Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "manitejavadnala@gmail.com",
    pass: "fppo lbmw edaf macr",
  },
});

// API Base URL
const baseURL = "http://localhost:5000"; 

// Function to fetch Admins and their reports
const fetchAdminReport = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Fetch all Admins
    const [admins] = await connection.execute(
      "SELECT id, email FROM employees WHERE role = 'admin'"
    );

    if (!admins.length) {
      console.log("No Admins found.");
      return [];
    }

    // Fetch Lead Data from API
    const endpoints = [
      `${baseURL}/leads/today`,
      `${baseURL}/leads/confirmed`,
      `${baseURL}/leads/in-progress`,
      `${baseURL}/leads/yesterday`,
      `${baseURL}/leads/confirmed/yesterday`,
      `${baseURL}/leads/in-progress/yesterday`,
      `${baseURL}/leads/facebook`,
      `${baseURL}/leads/referral`,
      `${baseURL}/leads/campaign`,
      `${baseURL}/leads/google`,
      `${baseURL}/leads/others`,
    ];

    const responses = await Promise.all(
      endpoints.map(url => axios.get(url).catch(() => ({ data: { count: 0 } }))) // Handle API errors
    );

    // Prepare Report Data
    const reportData = {
      leadsToday: responses[0].data.count,
      confirmedToday: responses[1].data.count,
      inProgressToday: responses[2].data.count,
      leadsYesterday: responses[3].data.count,
      confirmedYesterday: responses[4].data.count,
      inProgressYesterday: responses[5].data.count,
      facebookCount: responses[6].data.count,
      referralCount: responses[7].data.count,
      campaignCount: responses[8].data.count,
      googleCount: responses[9].data.count,
      othersCount: responses[10].data.count,
    };

    let adminReports = admins.map(admin => ({
      adminEmail: admin.email,
      ...reportData,
    }));

    await connection.end();
    return adminReports;
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return [];
  }
};

// Function to send Admin Reports via Email
const sendAdminReports = async () => {
  const reports = await fetchAdminReport();
  if (!reports.length) return;

  for (const report of reports) {
    const emailBody = `
      <h2>Admin Dashboard Report</h2>
      <p><strong>Leads Today:</strong> ${report.leadsToday}</p>
      <p><strong>Confirmed Today:</strong> ${report.confirmedToday}</p>
      <p><strong>In Progress Today:</strong> ${report.inProgressToday}</p>
      <p><strong>Leads Yesterday:</strong> ${report.leadsYesterday}</p>
      <p><strong>Confirmed Yesterday:</strong> ${report.confirmedYesterday}</p>
      <p><strong>In Progress Yesterday:</strong> ${report.inProgressYesterday}</p>
      <h3>Leads by Source:</h3>
      <p><strong>Facebook:</strong> ${report.facebookCount}</p>
      <p><strong>Referral:</strong> ${report.referralCount}</p>
      <p><strong>Campaign:</strong> ${report.campaignCount}</p>
      <p><strong>Google:</strong> ${report.googleCount}</p>
      <p><strong>Others:</strong> ${report.othersCount}</p>
    `;

    const mailOptions = {
      from: "manitejavadnala@gmail.com",
      to: report.adminEmail,
      subject: "Daily Admin Dashboard Report",
      html: emailBody,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(`Error sending email to ${report.adminEmail}:`, err);
      } else {
        console.log(`Email sent to ${report.adminEmail}:`, info.response);
      }
    });
  }
};

// Schedule Admin Report at 9:30 AM and 9:30 PM
cron.schedule("06 19 * * *", () => {
  console.log("Running daily admin report...");
  sendAdminReports();
});

console.log("Cron job scheduled: Daily admin report at 9:30 AM and 9:30 PM.");
