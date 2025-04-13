import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getImageUrl } from "../../utils/base_utl";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export const addHotel = async (req: Request, res: Response) => {
  try {
    const {
      name,
      location,
      numberOfReview,
      rating,
      bookingLink,
      pool,
      restaurant,
      freeWifi,
      spa,
    } = req.body;
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
        image: getImageUrl(newHotel.image),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const deleteHotel = async (req: Request, res: Response) => {
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
      const imagePath = path.join(
        __dirname,
        "../../uploads",
        existingHotel.image
      );

      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Failed to delete image file:", err);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Hotel deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getAllHotels = async (req: Request, res: Response) => {
  try {
    const {
      name,
      location,
      numberOfReview,
      rating,
      bookingLink,
      pool,
      restaurant,
      freeWifi,
      spa,
      search,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const take = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * take;

    // Create filters for the query
    const filters: any = {
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
        select: { // Select only necessary fields for faster queries
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
      image: getImageUrl(hotel.image),
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};


