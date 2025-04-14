"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTraditionalDishes = exports.deleteTraditionalDish = exports.addTraditionalDish = void 0;
const client_1 = require("@prisma/client");
const base_utl_1 = require("../../utils/base_utl");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
const addTraditionalDish = async (req, res) => {
    try {
        const { name, price, numberOfReview, rating, bookingLink, } = req.body;
        const image = req.file?.filename;
        const requiredFields = [
            "name",
            "price",
            "numberOfReview",
            "rating",
            "bookingLink",
        ];
        const missing = requiredFields.find((field) => !req.body[field]);
        if (missing) {
            res.status(400).json({
                success: false,
                message: `${missing} is required!`,
            });
            return;
        }
        if (!image) {
            res.status(400).json({ success: false, message: "Image is required!" });
            return;
        }
        const newDish = await prisma.traditionalDish.create({
            data: {
                name,
                price,
                numberOfReview,
                rating,
                bookingLink,
                image,
            },
        });
        res.status(201).json({
            success: true,
            message: "Traditional dish added successfully",
            data: {
                ...newDish,
                image: (0, base_utl_1.getImageUrl)(newDish.image),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
exports.addTraditionalDish = addTraditionalDish;
const deleteTraditionalDish = async (req, res) => {
    const { id } = req.params;
    try {
        const existingDish = await prisma.traditionalDish.findUnique({ where: { id } });
        if (!existingDish) {
            res.status(404).json({
                success: false,
                message: "Traditional dish not found",
            });
            return;
        }
        await prisma.traditionalDish.delete({ where: { id } });
        if (existingDish.image) {
            const imagePath = path_1.default.join(__dirname, "../../uploads", existingDish.image);
            fs_1.default.unlink(imagePath, (err) => {
                if (err) {
                    console.error("Failed to delete image file:", err);
                }
            });
        }
        res.status(200).json({
            success: true,
            message: "Traditional dish deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
exports.deleteTraditionalDish = deleteTraditionalDish;
const getAllTraditionalDishes = async (req, res) => {
    try {
        const { name, minPrice, maxPrice, numberOfReview, rating, bookingLink, search, page = "1", limit = "10", } = req.query;
        const pageNumber = parseInt(page, 10);
        const take = parseInt(limit, 10);
        const skip = (pageNumber - 1) * take;
        const filters = {
            ...(name && { name: { contains: String(name), mode: "insensitive" } }),
            ...(minPrice && { price: { gte: parseFloat(String(minPrice)) } }),
            ...(maxPrice && { price: { lte: parseFloat(String(maxPrice)) } }),
            ...(numberOfReview && { numberOfReview: String(numberOfReview) }),
            ...(rating && { rating: String(rating) }),
            ...(bookingLink && { bookingLink: { contains: String(bookingLink), mode: "insensitive" } }),
            ...(search && {
                OR: [
                    { name: { contains: String(search), mode: "insensitive" } },
                    { bookingLink: { contains: String(search), mode: "insensitive" } },
                    { price: { contains: String(search), mode: "insensitive" } },
                ],
            }),
        };
        const [dishes, totalCount] = await Promise.all([
            prisma.traditionalDish.findMany({
                where: filters,
                orderBy: { createdAt: "desc" },
                skip,
                take,
            }),
            prisma.traditionalDish.count({ where: filters }),
        ]);
        const formattedDishes = dishes.map((dish) => ({
            ...dish,
            image: (0, base_utl_1.getImageUrl)(dish.image),
        }));
        const totalPages = take ? Math.ceil(totalCount / take) : 1;
        res.status(200).json({
            success: true,
            message: "Traditional dishes fetched successfully",
            data: formattedDishes,
            pagination: {
                totalData: totalCount,
                page: pageNumber,
                totalPages,
                nextPage: take ? pageNumber < totalPages : false,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
exports.getAllTraditionalDishes = getAllTraditionalDishes;
//# sourceMappingURL=traditional_dish.controllers.js.map