import { NextApiRequest, NextApiResponse } from "next";
import { ProductService } from "../../lib/services/productService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Only GET requests are allowed",
    });
  }

  try {
    const categories = await ProductService.getCategories();

    res.status(200).json({
      success: true,
      categories: categories,
      count: categories.length,
      message: `Retrieved ${categories.length} categories`,
    });
  } catch (error: any) {
    console.error("Categories API error:", error);
    res.status(500).json({
      error: "Failed to fetch categories",
      message: "Unable to retrieve categories from database",
    });
  }
}
