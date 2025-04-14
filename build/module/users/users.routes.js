"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_controller_1 = require("./users.controller");
const router = express_1.default.Router();
router.post("/register", users_controller_1.createUser);
router.post("/login", users_controller_1.loginUser);
router.post("/send-otp", users_controller_1.sendOtpToEmail);
router.post("/verify-otp", users_controller_1.verifyOtp);
router.post("/reset-password", users_controller_1.resetPassword);
exports.default = router;
//# sourceMappingURL=users.routes.js.map