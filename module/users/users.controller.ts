import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { baseUrl, getImageUrl } from "../../utils/base_utl";
import {
  generateOTP,
  sendForgotPasswordOTP,
} from "../../utils/emailService.utils";

const prisma = new PrismaClient();

export const createUser = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;

    const missing = ["fullName", "email", "password"].find(
      (field) => !req.body[field]
    );

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
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

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    const userWithFullImage = {
      ...user,
      image: user.image ? getImageUrl(user.image) : null,
    };

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: userWithFullImage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

// step 1:
// step 1:
export const sendOtpToEmail = async (req: Request, res: Response) => {
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

    const otp = generateOTP();

    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await prisma.ucord.upsert({
      where: { email },
      update: { otp, otpExpiresAt },
      create: { email, otp, otpExpiresAt },
    });

    sendForgotPasswordOTP(user.fullName, email, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent to email successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error",
    });
  }
};

// step 2
export const verifyOtp = async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
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

    if (
      !record.passwordResetAllowedUntil ||
      new Date() > new Date(record.passwordResetAllowedUntil)
    ) {
      res.status(403).json({
        success: false,
        message: "Password reset link has expired. Please request a new reset.",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await prisma.ucord.delete({ where: { email } });

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error",
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      fullName = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Validate sorting parameters
    const allowedSortFields = ["fullName", "email", "createdAt"];
    const validSortBy = allowedSortFields.includes(sortBy as string)
      ? sortBy
      : "createdAt";
    const validSortOrder = ["asc", "desc"].includes(sortOrder as string)
      ? sortOrder
      : "desc";

    // Build where clause
    const whereClause = {
      role: { not: "ADMIN" as const },
      ...(fullName && {
        fullName: {
          contains: fullName as string,
          mode: "insensitive" as const,
        },
      }),
    };

    // Define select fields
    const selectFields = {
      id: true,
      fullName: true,
      email: true,
      image: true,
      createdAt: true,
      role: true,
    };

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { [validSortBy as string]: validSortOrder },
        select: selectFields,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // Process user data efficiently
    const usersWithImageUrl = users.map(({ image, ...user }) => ({
      ...user,
      image: image ? getImageUrl(image.replace(/^\/?uploads\//, "")) : null,
    }));

    const totalPages = Math.ceil(total / limitNum);

    // Return structured response
    res.status(200).json({
      success: true,
      data: usersWithImageUrl,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        nextPage: pageNum < totalPages,
        // hasPreviousPage: pageNum > 1,
      },
      meta: {
        sortBy: validSortBy,
        sortOrder: validSortOrder,
      },
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// rm -rf node_modules/.prisma
// rm -rf node_modules/@prisma/client
// npm install
// npx prisma generate
