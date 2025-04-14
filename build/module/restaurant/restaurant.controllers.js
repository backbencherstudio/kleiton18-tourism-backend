"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRestaurants = exports.deleteRestaurant = exports.addRestaurant = void 0;
const client_1 = require("@prisma/client");
const base_utl_1 = require("../../utils/base_utl");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
const addRestaurant = async (req, res) => {
    try {
        const { name, location, numberOfReview, rating, openTime, closeTime, details, bookingLink, } = req.body;
        const image = req.file?.filename;
        const requiredFields = [
            "name",
            "location",
            "numberOfReview",
            "rating",
            "openTime",
            "closeTime",
            "details",
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
        const newRestaurant = await prisma.restaurant.create({
            data: {
                name,
                location,
                numberOfReview,
                rating,
                openTime,
                closeTime,
                details,
                bookingLink,
                image,
            },
        });
        res.status(201).json({
            success: true,
            message: "Restaurant added successfully",
            data: {
                ...newRestaurant,
                image: (0, base_utl_1.getImageUrl)(newRestaurant.image),
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
exports.addRestaurant = addRestaurant;
const deleteRestaurant = async (req, res) => {
    const { id } = req.params;
    try {
        const existingRestaurant = await prisma.restaurant.findUnique({ where: { id } });
        if (!existingRestaurant) {
            res.status(404).json({
                success: false,
                message: "Restaurant not found",
            });
            return;
        }
        await prisma.restaurant.delete({ where: { id } });
        if (existingRestaurant.image) {
            const imagePath = path_1.default.join(__dirname, "../../uploads", existingRestaurant.image);
            fs_1.default.unlink(imagePath, (err) => {
                if (err) {
                    console.error("Failed to delete image file:", err);
                }
            });
        }
        res.status(200).json({
            success: true,
            message: "Restaurant deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
exports.deleteRestaurant = deleteRestaurant;
const getAllRestaurants = async (req, res) => {
    try {
        const { name, location, numberOfReview, rating, openTime, closeTime, bookingLink, search, page = "1", limit = "10", } = req.query;
        const pageNumber = parseInt(page, 10);
        const take = parseInt(limit, 10);
        const skip = (pageNumber - 1) * take;
        const filters = {
            ...(name && { name: { contains: String(name), mode: "insensitive" } }),
            ...(location && { location: { contains: String(location), mode: "insensitive" } }),
            ...(numberOfReview && { numberOfReview: String(numberOfReview) }),
            ...(rating && { rating: String(rating) }),
            ...(openTime && { openTime: String(openTime) }),
            ...(closeTime && { closeTime: String(closeTime) }),
            ...(bookingLink && { bookingLink: { contains: String(bookingLink), mode: "insensitive" } }),
            ...(search && {
                OR: [
                    { name: { contains: String(search), mode: "insensitive" } },
                    { location: { contains: String(search), mode: "insensitive" } },
                    { details: { contains: String(search), mode: "insensitive" } },
                ],
            }),
        };
        const [restaurants, totalCount] = await Promise.all([
            prisma.restaurant.findMany({
                where: filters,
                orderBy: { createdAt: "desc" },
                skip,
                take,
            }),
            prisma.restaurant.count({ where: filters }),
        ]);
        const formattedRestaurants = restaurants.map((restaurant) => ({
            ...restaurant,
            image: (0, base_utl_1.getImageUrl)(restaurant.image),
        }));
        const totalPages = take ? Math.ceil(totalCount / take) : 1;
        res.status(200).json({
            success: true,
            message: "Restaurants fetched successfully",
            data: formattedRestaurants,
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
exports.getAllRestaurants = getAllRestaurants;
//# sourceMappingURL=restaurant.controllers.js.map