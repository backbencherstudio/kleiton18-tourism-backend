"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyOtp = exports.sendOtpToEmail = exports.loginUser = exports.createUser = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const base_utl_1 = require("../../utils/base_utl");
const emailService_utils_1 = require("../../utils/emailService.utils");
const prisma = new client_1.PrismaClient();
const createUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const missing = ["fullName", "email", "password"].find((field) => !req.body[field]);
        if (missing) {
            res.status(400).json({
                success: false,
                message: `${missing} is required!`,
            });
            return;
        }
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: "User already exists",
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
                role: "USER",
            },
        });
        const token = jsonwebtoken_1.default.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: "30d" });
        res.status(201).json({
            success: true,
            message: "User created successfully",
            token,
            user: newUser,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
exports.createUser = createUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const missing = ["email", "password"].find((field) => !req.body[field]);
        if (missing) {
            res.status(400).json({
                success: false,
                message: `${missing} is required!`,
            });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d" });
        const userWithFullImage = {
            ...user,
            image: user.image ? (0, base_utl_1.getImageUrl)(user.image) : null,
        };
        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            user: userWithFullImage,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
exports.loginUser = loginUser;
// step 1:
// step 1:
const sendOtpToEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: "Email is required" });
            return;
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        const otp = (0, emailService_utils_1.generateOTP)();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        await prisma.ucord.upsert({
            where: { email },
            update: { otp, otpExpiresAt },
            create: { email, otp, otpExpiresAt },
        });
        (0, emailService_utils_1.sendForgotPasswordOTP)(user.fullName, email, otp);
        res.status(200).json({
            success: true,
            message: "OTP sent to email successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Server error",
        });
    }
};
exports.sendOtpToEmail = sendOtpToEmail;
// step 2
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        // for user
        if (!otp) {
            res.status(400).json({
                success: false,
                message: "OTP is required",
            });
            return;
        }
        // for developer
        if (!email) {
            res.status(400).json({
                success: false,
                message: "Behind the scene: Email is required",
            });
            return;
        }
        const record = await prisma.ucord.findUnique({ where: { email } });
        if (!record || record.otp !== otp) {
            res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
            return;
        }
        if (!record.otpExpiresAt || new Date() > new Date(record.otpExpiresAt)) {
            res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one.",
            });
            return;
        }
        // ✅ Set password reset validity to 1 hour from now
        const passwordResetUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await prisma.ucord.update({
            where: { email },
            data: { passwordResetAllowedUntil: passwordResetUntil },
        });
        res.status(200).json({
            success: true,
            message: "OTP verified successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Server error",
        });
    }
};
exports.verifyOtp = verifyOtp;
const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email) {
            res.status(400).json({
                success: false,
                message: "Behind the scene: Email is required",
            });
            return;
        }
        if (!newPassword) {
            res.status(400).json({
                success: false,
                message: "New password is required",
            });
            return;
        }
        const record = await prisma.ucord.findUnique({ where: { email } });
        if (!record) {
            res.status(400).json({
                success: false,
                message: "No reset request found for this email",
            });
            return;
        }
        if (!record.passwordResetAllowedUntil ||
            new Date() > new Date(record.passwordResetAllowedUntil)) {
            res.status(403).json({
                success: false,
                message: "Password reset link has expired. Please request a new reset.",
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });
        await prisma.ucord.delete({ where: { email } });
        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Server error",
        });
    }
};
exports.resetPassword = resetPassword;
// rm -rf node_modules/.prisma
// rm -rf node_modules/@prisma/client
// npm install
// npx prisma generate
//# sourceMappingURL=users.controller.js.map