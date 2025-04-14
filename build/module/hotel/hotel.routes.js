"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyUsers_1 = __importDefault(require("../../middleware/verifyUsers"));
const multer_config_1 = __importDefault(require("../../config/multer.config"));
const hotel_controllers_1 = require("./hotel.controllers");
const router = express_1.default.Router();
router.post("/add", verifyUsers_1.default, multer_config_1.default.single("image"), hotel_controllers_1.addHotel);
router.get("/get", hotel_controllers_1.getAllHotels);
router.delete("/delete/:id", verifyUsers_1.default, hotel_controllers_1.deleteHotel);
exports.default = router;
//# sourceMappingURL=hotel.routes.js.map