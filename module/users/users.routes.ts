import express from "express";
import { createUser, loginUser, sendOtpToEmail, verifyOtp, resetPassword } from "./users.controller";
import verifyUser from "../../middleware/verifyUsers";
import upload from "../../config/multer.config";


const router = express.Router();


router.post("/register", createUser);
router.post("/login", loginUser);


router.post("/send-otp", sendOtpToEmail);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

export default router;