import { NextApiRequest, NextApiResponse } from "next";
import { ProductService } from "../../lib/services/productService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "GET":
        await handleGetProducts(req, res);
        break;
      case "POST":
        await handleCreateProduct(req, res);
        break;
      default:
        res.status(405).json({
          error: "Method not allowed",
          message: `Method ${req.method} not allowed`,
        });
    }
  } catch (error: any) {
    console.error("Products API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred. Please try again.",
    });
  }
}

async function handleGetProducts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, search } = req.query;

    let products;

    if (search && typeof search === "string") {
      products = await ProductService.searchProducts(search);
    } else if (category && typeof category === "string") {
      products = await ProductService.getProductsByCategory(category);
    } else {
      products = await ProductService.getAllProducts();
    }

    res.status(200).json({
      success: true,
      products: products,
      count: products.length,
      message: `Retrieved ${products.length} products`,
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      error: "Failed to fetch products",
      message: "Unable to retrieve products from database",
    });
  }
}

async function handleCreateProduct(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, category, image_url, price, description } = req.body;

    // Validate required fields
    if (!name || !category || !image_url || !price) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Name, category, image_url, and price are required",
      });
    }

    // Validate price
    if (typeof price !== "number" || price <= 0) {
      return res.status(400).json({
        error: "Invalid price",
        message: "Price must be a positive number",
      });
    }

    // Create product
    const productId = await ProductService.addProduct({
      name,
      category,
      image_url,
      price,
      description: description || null,
    });

    res.status(201).json({
      success: true,
      productId: productId,
      message: "Product created successfully",
    });
  } catch (error: any) {
    console.error("Error creating product:", error);

    if (error.message.includes("Duplicate entry")) {
      return res.status(400).json({
        error: "Product already exists",
        message: "A product with this name already exists",
      });
    }

    res.status(500).json({
      error: "Failed to create product",
      message: "Unable to create product in database",
    });
  }
}
