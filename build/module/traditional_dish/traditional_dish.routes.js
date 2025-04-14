"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyUsers_1 = __importDefault(require("../../middleware/verifyUsers"));
const multer_config_1 = __importDefault(require("../../config/multer.config"));
const traditional_dish_controllers_1 = require("./traditional_dish.controllers");
const router = express_1.default.Router();
router.post("/add", verifyUsers_1.default, multer_config_1.default.single("image"), traditional_dish_controllers_1.addTraditionalDish);
router.get("/get", traditional_dish_controllers_1.getAllTraditionalDishes);
router.delete("/delete/:id", verifyUsers_1.default, traditional_dish_controllers_1.deleteTraditionalDish);
exports.default = router;
//# sourceMappingURL=traditional_dish.routes.js.map