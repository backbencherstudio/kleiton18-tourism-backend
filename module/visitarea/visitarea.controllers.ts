import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getImageUrl } from "../../utils/base_utl";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export const addVisitArea = async (req: Request, res: Response) => {
  try {
    const {
      name,
      location,
      description,
      detailsLink,
    } = req.body;
    const image = req.file?.filename;

    const requiredFields = [
      "name",
      "location",
      "description",
      "detailsLink",
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

    const newVisitArea = await prisma.visitArea.create({
      data: {
        name,
        location,
        description,
        detailsLink,
        image,
      },
    });

    res.status(201).json({
      success: true,
      message: "Visit area added successfully",
      data: {
        ...newVisitArea,
        image: getImageUrl(newVisitArea.image),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const deleteVisitArea = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingVisitArea = await prisma.visitArea.findUnique({ where: { id } });

    if (!existingVisitArea) {
      res.status(404).json({
        success: false,
        message: "Visit area not found",
      });
      return;
    }

    await prisma.visitArea.delete({ where: { id } });

    if (existingVisitArea.image) {
      const imagePath = path.join(
        __dirname,
        "../../uploads",
        existingVisitArea.image
      );

      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Failed to delete image file:", err);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Visit area deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getAllVisitAreas = async (req: Request, res: Response) => {
  try {
    const {
      name,
      location,
      search,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const take = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * take;

    const filters: any = {
      ...(name && { name: { contains: String(name), mode: "insensitive" } }),
      ...(location && { location: { contains: String(location), mode: "insensitive" } }),
      ...(search && {
        OR: [
          { name: { contains: String(search), mode: "insensitive" } },
          { location: { contains: String(search), mode: "insensitive" } },
          { description: { contains: String(search), mode: "insensitive" } },
        ],
      }),
    };

    const [visitAreas, totalCount] = await Promise.all([
      prisma.visitArea.findMany({
        where: filters,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          name: true,
          location: true,
          description: true,
          detailsLink: true,
          image: true,
          createdAt: true,
        },
      }),
      prisma.visitArea.count({ where: filters }),
    ]);

    const formattedVisitAreas = visitAreas.map((area) => ({
      ...area,
      image: getImageUrl(area.image),
    }));

    const totalPages = take ? Math.ceil(totalCount / take) : 1;

    res.status(200).json({
      success: true,
      message: "Visit areas fetched successfully",
      data: formattedVisitAreas,
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