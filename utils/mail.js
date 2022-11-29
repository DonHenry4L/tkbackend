const nodemailer = require("nodemailer");

exports.generateOTP = (otp_length = 6) => {
  // generate 6 digit otp
  let OTP = "";
  for (let i = 1; i <= otp_length; i++) {
    const randomVal = Math.round(Math.random() * 9);
    OTP += randomVal;
  }

  return OTP;
};

exports.generateMailTransporter = () =>
  nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    secure: false,
    requireTLS: true,
    port: 2525,
    auth: {
      user: process.env.MAIL_TRAP_USER,
      pass: process.env.MAIL_TRAP_PASS,
    },
  });
