"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllHotels = exports.deleteHotel = exports.addHotel = void 0;
const client_1 = require("@prisma/client");
const base_utl_1 = require("../../utils/base_utl");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
const addHotel = async (req, res) => {
    try {
        const { name, location, numberOfReview, rating, bookingLink, pool, restaurant, freeWifi, spa, } = req.body;
        const image = req.file?.filename;
        console.log(req.body);
        const requiredFields = [
            "name",
            "location",
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
        const newHotel = await prisma.hotel.create({
            data: {
                name,
                location,
                numberOfReview: numberOfReview,
                rating: rating,
                bookingLink,
                image,
                pool: pool === "true",
                restaurant: restaurant === "true",
                freeWifi: freeWifi === "true",
                spa: spa === "true",
            },
        });
        res.status(201).json({
            success: true,
            message: "Hotel added successfully",
            data: {
                ...newHotel,
                image: (0, base_utl_1.getImageUrl)(newHotel.image),
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
exports.addHotel = addHotel;
const deleteHotel = async (req, res) => {
    const { id } = req.params;
    try {
        const existingHotel = await prisma.hotel.findUnique({ where: { id } });
        if (!existingHotel) {
            res.status(404).json({
                success: false,
                message: "Hotel not found",
            });
            return;
        }
        await prisma.hotel.delete({ where: { id } });
        if (existingHotel.image) {
            const imagePath = path_1.default.join(__dirname, "../../uploads", existingHotel.image);
            fs_1.default.unlink(imagePath, (err) => {
                if (err) {
                    console.error("Failed to delete image file:", err);
                }
            });
        }
        res.status(200).json({
            success: true,
            message: "Hotel deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
exports.deleteHotel = deleteHotel;
const getAllHotels = async (req, res) => {
    try {
        const { name, location, numberOfReview, rating, bookingLink, pool, restaurant, freeWifi, spa, search, page = "1", limit = "10", } = req.query;
        const pageNumber = parseInt(page, 10);
        const take = parseInt(limit, 10);
        const skip = (pageNumber - 1) * take;
        // Create filters for the query
        const filters = {
            ...(name && { name: { contains: String(name), mode: "insensitive" } }),
            ...(location && { location: { contains: String(location), mode: "insensitive" } }),
            ...(numberOfReview && { numberOfReview: String(numberOfReview) }),
            ...(rating && { rating: String(rating) }),
            ...(bookingLink && { bookingLink: { contains: String(bookingLink), mode: "insensitive" } }),
            ...(pool !== undefined && { pool: pool === "true" }),
            ...(restaurant !== undefined && { restaurant: restaurant === "true" }),
            ...(freeWifi !== undefined && { freeWifi: freeWifi === "true" }),
            ...(spa !== undefined && { spa: spa === "true" }),
            ...(search && {
                OR: [
                    { name: { contains: String(search), mode: "insensitive" } },
                    { location: { contains: String(search), mode: "insensitive" } },
                    { bookingLink: { contains: String(search), mode: "insensitive" } },
                ],
            }),
        };
        // Fetch hotels and count in parallel for performance
        const [hotels, totalCount] = await Promise.all([
            prisma.hotel.findMany({
                where: filters,
                orderBy: { createdAt: "desc" },
                skip,
                take,
                select: {
                    id: true,
                    name: true,
                    location: true,
                    numberOfReview: true,
                    rating: true,
                    bookingLink: true,
                    image: true,
                    pool: true,
                    restaurant: true,
                    freeWifi: true,
                    spa: true,
                    createdAt: true
                },
            }),
            prisma.hotel.count({ where: filters }),
        ]);
        const formattedHotels = hotels.map((hotel) => ({
            ...hotel,
            image: (0, base_utl_1.getImageUrl)(hotel.image),
        }));
        const totalPages = take ? Math.ceil(totalCount / take) : 1;
        res.status(200).json({
            success: true,
            message: "Hotels fetched successfully",
            data: formattedHotels,
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
exports.getAllHotels = getAllHotels;
//# sourceMappingURL=hotel.controllers.js.map