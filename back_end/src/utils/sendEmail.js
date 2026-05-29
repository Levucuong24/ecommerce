const nodemailer = require("nodemailer");
const config = require("../config/env");

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: true, // true for 465, false for other ports
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  const mailOptions = {
    from: `"Ecommerce Admin" <${config.smtp.user}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
