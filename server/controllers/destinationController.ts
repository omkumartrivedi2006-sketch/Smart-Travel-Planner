import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { Destination } from "../models/Destination";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";
import { resolveImageForDestination, queueImageResolution } from "../services/imageService";

/**
 * Get all destinations with search, filters, sorting, and pagination
 * GET /api/destinations
 */
export async function getDestinations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { search, country, category, maxCost, maxBudget, sort, page, limit } = req.query;

    const queryFilter: any = {};

    // 1. Search (matches name, country, state, city, category, attractions, or famousFor)
    if (search) {
      const escapedSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");
      queryFilter.$or = [
        { name: searchRegex },
        { country: searchRegex },
        { state: searchRegex },
        { city: searchRegex },
        { category: searchRegex },
        { categories: searchRegex },
        { topAttractions: searchRegex },
        { famousFor: searchRegex },
      ];
    }

    // 2. Filters
    if (country) {
      const escapedCountry = String(country).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      queryFilter.country = new RegExp(`^${escapedCountry}$`, "i");
    }
    if (category) {
      const escapedCategory = String(category).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Match against both legacy `category` string AND new `categories[]` array
      queryFilter.$or = [
        ...(queryFilter.$or || []),
        { category: new RegExp(`^${escapedCategory}$`, "i") },
        { categories: search ? new RegExp(escapedCategory, "i") : escapedCategory },
      ];
    }
    
    const budgetLimitVal = maxBudget || maxCost;
    if (budgetLimitVal) {
      const costLimit = Number(budgetLimitVal);
      if (isNaN(costLimit)) {
        throw new BadRequestError("maxBudget or maxCost must be a valid number");
      }
      queryFilter.$or = [
        ...(queryFilter.$or || []),
        { averageBudget: { $lte: costLimit } },
        { averageCost: { $lte: costLimit } },
      ];
    }

    // 3. Sorting
    let sortObj: any = {};
    if (sort) {
      const sortStr = String(sort);
      const isDesc = sortStr.startsWith("-");
      const field = isDesc ? sortStr.substring(1) : sortStr;
      
      // Allow sorting only on specific safe fields
      const allowedFields = ["name", "averageCost", "averageBudget", "rating", "createdAt"];
      if (allowedFields.includes(field)) {
        sortObj[field] = isDesc ? -1 : 1;
      } else {
        sortObj.name = 1;
      }
    } else {
      sortObj.name = 1; // Default alphabetical sort
    }

    // 4. Pagination
    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const limitNum = Math.max(1, parseInt(String(limit)) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel
    const [destinations, totalCount] = await Promise.all([
      Destination.find(queryFilter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Destination.countDocuments(queryFilter),
    ]);

    // Progressive image resolution: check if any fetched destinations have empty image fields
    // Queue background resolution asynchronously so we don't block the API response and respect rate limits
    destinations.forEach((dest) => {
      if (!dest.image || dest.image.trim() === "" || dest.images.length === 0) {
        queueImageResolution(dest._id.toString());
      }
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      status: "success",
      results: destinations.length,
      data: {
        destinations,
        pagination: {
          totalCount,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single destination details
 * GET /api/destinations/:id
 */
export async function getDestinationById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    let destination;

    if (mongoose.Types.ObjectId.isValid(id)) {
      destination = await Destination.findById(id);
    } else {
      destination = await Destination.findOne({ slug: id.toLowerCase() });
    }

    if (!destination) {
      throw new NotFoundError("Destination not found");
    }

    // Resolve image synchronously if missing/placeholder
    if (!destination.image || destination.image.trim() === "" || destination.images.length === 0 || destination.image.startsWith("data:image/svg+xml")) {
      const resolvedUrl = await resolveImageForDestination(destination._id.toString());
      if (resolvedUrl) {
        const updatedDest = await Destination.findById(destination._id);
        if (updatedDest) {
          destination = updatedDest;
        }
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        destination,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new destination (Admin only)
 * POST /api/destinations
 */
export async function createDestination(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const newDestination = await Destination.create(req.body);
    logger.info(`New destination created: ${newDestination.name}`);

    res.status(201).json({
      status: "success",
      data: {
        destination: newDestination,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a destination (Admin only)
 * PUT /api/destinations/:id
 */
export async function updateDestination(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const updatedDestination = await Destination.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedDestination) {
      throw new NotFoundError("Destination not found");
    }

    logger.info(`Destination updated: ${updatedDestination.name}`);

    res.status(200).json({
      status: "success",
      data: {
        destination: updatedDestination,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a destination (Admin only)
 * DELETE /api/destinations/:id
 */
export async function deleteDestination(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const deletedDestination = await Destination.findByIdAndDelete(id);

    if (!deletedDestination) {
      throw new NotFoundError("Destination not found");
    }

    logger.info(`Destination deleted: ${deletedDestination.name}`);

    res.status(200).json({
      status: "success",
      message: "Destination successfully deleted",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update destination images (Public/User endpoint to cache resolved external images)
 * PUT /api/destinations/:id/update-images
 */
export async function updateDestinationImages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { image, images } = req.body;

    const destination = await Destination.findById(id);
    if (!destination) {
      throw new NotFoundError("Destination not found");
    }

    if (image) {
      destination.image = image;
    }
    if (images && Array.isArray(images) && images.length > 0) {
      destination.images = images;
    }

    await destination.save();
    logger.info(`Destination images successfully cached in DB for: ${destination.name}`);

    res.status(200).json({
      status: "success",
      data: {
        destination,
      },
    });
  } catch (error) {
    next(error);
  }
}
