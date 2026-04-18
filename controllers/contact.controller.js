const nodemailer = require("nodemailer");
const { createNotification } = require("../utils/notification");
require("dotenv").config();

const sendContactEmail = async (req, res) => {
  try {
    const { full_name, email, subject, message } = req.body;

    if (!full_name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: email,
      to: process.env.ADMIN_EMAIL,
      subject: `Dis-Hub Contact: ${subject}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${full_name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    await createNotification("system", {
      action: "success",
      message: `You have recieved an email from ${full_name} : ${email}.`
    });
    res.json({ success: true, message: "✅ Email sent Successfully" });
    
  } catch (err) {
    console.error(err);
    await createNotification("system", {
      action: "danger",
      message: `Failed to send Email Address!!!`
    });
    res.status(500).json({ success: false, message: "❌ Failed to send email" });
  }
};

module.exports = { sendContactEmail };