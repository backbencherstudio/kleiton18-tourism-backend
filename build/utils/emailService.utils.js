"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendForgotPasswordOTP = exports.generateOTP = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const email_message_1 = require("../constants/email_message");
dotenv_1.default.config();
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};
exports.generateOTP = generateOTP;
const sendEmail = async (to, subject, htmlContent) => {
    const mailTransporter = nodemailer_1.default.createTransport({
        host: "smtp.mailtrap.io", // Update if you're using a different SMTP provider
        service: "gmail",
        auth: {
            user: process.env.NODE_MAILER_USER || "",
            pass: process.env.NODE_MAILER_PASSWORD || "",
        },
    });
    const mailOptions = {
        from: `"kleiton18" <2003monowar@gmail.com>`,
        to,
        subject,
        html: htmlContent,
    };
    await mailTransporter.sendMail(mailOptions);
};
const sendForgotPasswordOTP = async (userName, email, otp) => {
    const htmlContent = (0, email_message_1.emailForgotPasswordOTP)(userName, email, otp);
    await sendEmail(email, "otp Code for reset password", htmlContent);
};
exports.sendForgotPasswordOTP = sendForgotPasswordOTP;
//# sourceMappingURL=emailService.utils.js.map