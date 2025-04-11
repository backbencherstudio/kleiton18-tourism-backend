import express from "express";
import { createUser } from "./users.controller";
import verifyUser from "../../middleware/verifyUsers";
import upload from "../../config/multer.config";


const router = express.Router();


router.post("/register", createUser);


export default router;