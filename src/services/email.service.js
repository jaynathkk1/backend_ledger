const nodemailer = require("nodemailer");


// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.APP_PASSWORD  // 16-char app password ONLY
//   },
//   debug: true  // Add for SMTP logs
// });



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    // pass: process.env.APP_PASSWORD,
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.log("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages", success);
  }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from: `"Backend Legend" <${process.env.EMAIL_USER}>`, //sender address
      to, //list of receivers
      subject, //subject line,
      text,//plain text
      html, //html body
    });
    console.log("Message sent: ", info.messageId);
    console.log("Preview URl: ", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.log("Error sending email", error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = "Welcome to Backend Legend!";

  const text = `Hello ${name},

Thank you for registering at Backend Legend.
We’re excited to have you on board!`;

  const html = `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #4CAF50;">Welcome to Backend Legend!</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for registering at <strong>Backend Legend</strong>. We’re thrilled to have you join our community of backend enthusiasts.</p>
      <p>Get ready to explore resources, tutorials, and projects that will help you become a true Backend Legend!</p>
      <br/>
      <p style="font-size: 14px; color: #555;">Best regards,<br/>The Backend Legend Team</p>
    </body>
  </html>
`;

  await sendEmail(userEmail, subject, text, html);
}


async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  try {
    // 2. Define email content
    const mailOptions = {
      from: `"Banking App" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Transaction Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4CAF50;">Transaction Successful ✅</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>We’re writing to confirm that your transaction has been processed successfully.</p>
          <table style="border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₹${amount}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Transferred To</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${toAccount}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">If you did not authorize this transaction, please contact our support team immediately.</p>
          <p style="margin-top: 30px;">Thank you,<br/>Your Banking App Team</p>
        </div>
      `,
    };

    // 3. Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Transaction email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending transaction email:", error);
    return false;
  }
}

async function sendFailedTransactionEmail(userEmail, name, amount, toAccount) {
  try {
    // 2. Define email content
    const mailOptions = {
      from: `"Banking App" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Transaction Failed",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #E53935;">Transaction Failed ❌</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>We regret to inform you that your recent transaction could not be processed.</p>
          <table style="border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₹${amount}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Intended Recipient</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${toAccount}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">Possible reasons include insufficient balance, incorrect account details, or network issues.</p>
          <p>Please try again later or contact our support team for assistance.</p>
          <p style="margin-top: 30px;">Thank you,<br/>Your Banking App Team</p>
        </div>
      `,
    };

    // 3. Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Failed transaction email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending failed transaction email:", error);
    return false;
  }
}
module.exports = {sendRegistrationEmail,sendTransactionEmail,sendFailedTransactionEmail };
