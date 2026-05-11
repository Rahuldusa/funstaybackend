module.exports = {
  apps: [
    {
      name: "funstay-backend",
      script: "./index.js",
      env: {
        NODE_ENV: "production",
        EMAIL_USER: "your_email@example.com",
        EMAIL_PASS: "your_email_password",
        PORT: 5000
      }
    }
  ]
};

