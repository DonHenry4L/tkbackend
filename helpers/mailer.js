const nodemailer = require("nodemailer");

const { google } = require("googleapis");
const emailVerificationToken = require("../models/emailVerificationToken");
const { generateOTP } = require("../utils/mail");
const User = require("../models/user");

const { OAuth2 } = google.auth;
const oauth_link = "https://developers.google.com/oauthplayground";
const { EMAIL, MAILING_ID, MAILING_REFRESH, MAILING_SECRET } = process.env;

const auth = new OAuth2(
  MAILING_ID,
  MAILING_SECRET,
  MAILING_REFRESH,
  oauth_link
);
const user = User();

exports.sendVerificationEmail = async (email, name, url) => {
  // generate 6 digit otp
  let OTP = generateOTP();

  // store otp inside our db
  const newEmailVerificationToken = new emailVerificationToken({
    owner: user._id,
    token: OTP,
  });

  await newEmailVerificationToken.save();
  // send that otp to our user

  auth.setCredentials({
    refresh_token: MAILING_REFRESH,
  });
  const accessToken = auth.getAccessToken();
  const stmp = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: EMAIL,
      clientId: MAILING_ID,
      clientSecret: MAILING_SECRET,
      refreshToken: MAILING_REFRESH,
      accessToken,
    },
  });
  const mailOptions = {
    from: EMAIL,
    to: email,
    subject: "TKfamily email verification",
    html: `<div style="max-width:700px;margin-bottom:1rem;display:flex;align-items:center;gap:10px;font-family:Roboto;font-weight:600;color:#3b5998"><img src="https://res.cloudinary.com/di0vcnj81/image/upload/v1666350886/tk_family-logo_vkn1tv.png" alt="" style="width:20%; height:20%; border-radius: 50%" ><span>Action requise : Activate your TkFamily account</span></div><div style="padding:1rem 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;color:#141823;font-size:17px;font-family:Roboto"><span>Hello ${name}</span><div style="padding:20px 0"><span style="padding:1.5rem 0">You recently created an account on TKFamily. To complete your registration, please confirm your account with the otp token below.</span></div><h1  style="width:200px;padding:10px 15px;background:#4c649b;color:#fff;text-decoration:none;font-weight:600">${OTP}</h1><br><div style="padding-top:20px"><span style="margin:1.5rem 0;color:#898f9c">TKFamily allows you to stay in touch with all your friends, once registered on TKFamily,you can share photos,organize events, earn Money and much more.</span></div></div>`,
  };
  stmp.sendMail(mailOptions, (err, res) => {
    if (err) return err;
    return res;
  });
};
exports.sendResetCode = (email, name, code) => {
  auth.setCredentials({
    refresh_token: MAILING_REFRESH,
  });
  const accessToken = auth.getAccessToken();
  const stmp = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: EMAIL,
      clientId: MAILING_ID,
      clientSecret: MAILING_SECRET,
      refreshToken: MAILING_REFRESH,
      accessToken,
    },
  });
  const mailOptions = {
    from: EMAIL,
    to: email,
    subject: "Reset TKf password",
    html: `<div style="max-width:700px;margin-bottom:1rem;display:flex;align-items:center;gap:10px;font-family:Roboto;font-weight:600;color:#3b5998"><img src="https://res.cloudinary.com/di0vcnj81/image/upload/v1666350886/tk_family-logo_vkn1tv.png" alt="" style="width:30px"><span>Action requise : Activate your facebook account</span></div><div style="padding:1rem 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;color:#141823;font-size:17px;font-family:Roboto"><span>Hello ${name}</span><div style="padding:20px 0"><span style="padding:1.5rem 0">You recently created an account on Facebook. To complete your registration, please confirm your account.</span></div><a  style="width:200px;padding:10px 15px;background:#4c649b;color:#fff;text-decoration:none;font-weight:600">${code}</a><br><div style="padding-top:20px"><span style="margin:1.5rem 0;color:#898f9c">Tkf allows you to stay in touch with all your friends, once registered on tkf,you can share photos,organize events and much more.</span></div></div>`,
  };
  stmp.sendMail(mailOptions, (err, res) => {
    if (err) return err;
    return res;
  });
};
