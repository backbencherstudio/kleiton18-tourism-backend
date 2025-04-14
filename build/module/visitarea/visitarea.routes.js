"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyUsers_1 = __importDefault(require("../../middleware/verifyUsers"));
const multer_config_1 = __importDefault(require("../../config/multer.config"));
const visitarea_controllers_1 = require("./visitarea.controllers");
const router = express_1.default.Router();
router.post("/add", verifyUsers_1.default, multer_config_1.default.single("image"), visitarea_controllers_1.addVisitArea);
router.get("/get", visitarea_controllers_1.getAllVisitAreas);
router.delete("/delete/:id", verifyUsers_1.default, visitarea_controllers_1.deleteVisitArea);
exports.default = router;
//# sourceMappingURL=visitarea.routes.js.map