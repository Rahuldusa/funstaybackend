const cron = require("node-cron");
const nodemailer = require("nodemailer");
const axios = require("axios");
const mysql = require("mysql2/promise");

// Your database connection
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "funstay",
};

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "manitejavadnala@gmail.com",
    pass: "fppo lbmw edaf macr",
  },
});

// Function to fetch managers from the database
const fetchManagers = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [managers] = await connection.execute(
      "SELECT id, email FROM employees WHERE role = 'manager'"
    );
    await connection.end();
    return managers;
  } catch (error) {
    console.error("Error fetching managers:", error);
    return [];
  }
};

// Function to fetch lead data for each manager
const fetchLeadData = async (managerId) => {
  try {
    const baseURL = "http://localhost:5000"; // Replace with your actual API URL
    const endpoints = [
      `${baseURL}/leads/today/${managerId}`,
      `${baseURL}/leads/confirmed/${managerId}`,
      `${baseURL}/leads/in-progress/${managerId}`,
      `${baseURL}/leads/yesterday/${managerId}`,
      `${baseURL}/leads/confirmed/yesterday/${managerId}`,
      `${baseURL}/leads/in-progress/yesterday/${managerId}`,
      `${baseURL}/leads/facebook/${managerId}`,
      `${baseURL}/leads/referral/${managerId}`,
      `${baseURL}/leads/campaign/${managerId}`,
      `${baseURL}/leads/google/${managerId}`,
      `${baseURL}/leads/others/${managerId}`,
    ];

    const responses = await Promise.all(endpoints.map((url) => axios.get(url)));

    return {
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
  } catch (error) {
    console.error(`Error fetching lead data for manager ${managerId}:`, error);
    return null;
  }
};

// Function to send reports via email
const sendManagerReports = async () => {
  const managers = await fetchManagers();
  if (!managers.length) return;

  for (const manager of managers) {
    const leadData = await fetchLeadData(manager.id);
    if (!leadData) continue;

    // Create an email report
    const emailBody = `
        <h1> Testing Emails</h1>
      <h2>Manager Daily Lead Report</h2>
      <p><strong>Leads Today:</strong> ${leadData.leadsToday}</p>
      <p><strong>Confirmed Today:</strong> ${leadData.confirmedToday}</p>
      <p><strong>In Progress Today:</strong> ${leadData.inProgressToday}</p>
      <p><strong>Leads Yesterday:</strong> ${leadData.leadsYesterday}</p>
      <p><strong>Confirmed Yesterday:</strong> ${leadData.confirmedYesterday}</p>
      <p><strong>In Progress Yesterday:</strong> ${leadData.inProgressYesterday}</p>
      <h3>Lead Sources:</h3>
      <p><strong>Facebook:</strong> ${leadData.facebookCount}</p>
      <p><strong>Referral:</strong> ${leadData.referralCount}</p>
      <p><strong>Campaign:</strong> ${leadData.campaignCount}</p>
      <p><strong>Google:</strong> ${leadData.googleCount}</p>
      <p><strong>Others:</strong> ${leadData.othersCount}</p>
    `;

    const mailOptions = {
      from: "manitejavadnala@gmail.com",
      to: manager.email,
      subject: "Daily Lead Report",
      html: emailBody,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(`Error sending email to ${manager.email}:`, err);
      } else {
        console.log(`Report sent to ${manager.email}:`, info.response);
      }
    });
  }
};

// Schedule the cron job to send emails at 9:00 AM daily
cron.schedule("12 19 * * *", () => {
  console.log("Running daily manager report...");
  sendManagerReports();
});

console.log("Cron job scheduled: Daily report for managers at 9:00 AM.");
