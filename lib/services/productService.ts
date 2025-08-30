import { executeQuery, Product, SearchResult } from "../database";

export class ProductService {
  /**
   * Get all products from database
   */
  static async getAllProducts(): Promise<Product[]> {
    try {
      const query = "SELECT * FROM products ORDER BY name ASC";
      const results = await executeQuery(query);
      return results as Product[];
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Failed to fetch products");
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      if (!category) {
        return await this.getAllProducts();
      }

      const query =
        "SELECT * FROM products WHERE category = ? ORDER BY name ASC";
      const results = await executeQuery(query, [category]);
      return results as Product[];
    } catch (error) {
      console.error("Error fetching products by category:", error);
      throw new Error("Failed to fetch products by category");
    }
  }

  /**
   * Get unique categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const query =
        "SELECT DISTINCT category FROM products ORDER BY category ASC";
      const results = await executeQuery(query);
      return results.map((row: any) => row.category);
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw new Error("Failed to fetch categories");
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: number): Promise<Product | null> {
    try {
      const query = "SELECT * FROM products WHERE id = ?";
      const results = await executeQuery(query, [id]);
      return results.length > 0 ? (results[0] as Product) : null;
    } catch (error) {
      console.error("Error fetching product by ID:", error);
      throw new Error("Failed to fetch product");
    }
  }

  /**
   * Search products by name
   */
  static async searchProducts(searchTerm: string): Promise<Product[]> {
    try {
      const query = `
        SELECT * FROM products 
        WHERE name LIKE ? OR description LIKE ? 
        ORDER BY name ASC
      `;
      const term = `%${searchTerm}%`;
      const results = await executeQuery(query, [term, term]);
      return results as Product[];
    } catch (error) {
      console.error("Error searching products:", error);
      throw new Error("Failed to search products");
    }
  }

  /**
   * Add new product
   */
  static async addProduct(
    product: Omit<Product, "id" | "created_at" | "updated_at">
  ): Promise<number> {
    try {
      const query = `
        INSERT INTO products (name, category, image_url, price, description, features)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const params = [
        product.name,
        product.category,
        product.image_url,
        product.price,
        product.description || null,
        JSON.stringify(product.features || []),
      ];

      const result: any = await executeQuery(query, params);
      return result.insertId;
    } catch (error) {
      console.error("Error adding product:", error);
      throw new Error("Failed to add product");
    }
  }

  /**
   * Update product features
   */
  static async updateProductFeatures(
    id: number,
    features: number[]
  ): Promise<boolean> {
    try {
      const query = "UPDATE products SET features = ? WHERE id = ?";
      await executeQuery(query, [JSON.stringify(features), id]);
      return true;
    } catch (error) {
      console.error("Error updating product features:", error);
      throw new Error("Failed to update product features");
    }
  }

  /**
   * Get products with features for similarity matching
   */
  static async getProductsWithFeatures(): Promise<Product[]> {
    try {
      const query =
        "SELECT * FROM products WHERE features IS NOT NULL ORDER BY id ASC";
      const results = await executeQuery(query);

      return results.map((product: any) => ({
        ...product,
        features: product.features ? JSON.parse(product.features) : [],
      })) as Product[];
    } catch (error) {
      console.error("Error fetching products with features:", error);
      throw new Error("Failed to fetch products with features");
    }
  }

  /**
   * Get product count
   */
  static async getProductCount(): Promise<number> {
    try {
      const query = "SELECT COUNT(*) as count FROM products";
      const results = await executeQuery(query);
      return results[0].count;
    } catch (error) {
      console.error("Error getting product count:", error);
      throw new Error("Failed to get product count");
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(id: number): Promise<boolean> {
    try {
      const query = "DELETE FROM products WHERE id = ?";
      const result: any = await executeQuery(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw new Error("Failed to delete product");
    }
  }

  /**
   * Batch update product features
   */
  static async batchUpdateFeatures(
    products: Array<{ id: number; features: number[] }>
  ): Promise<boolean> {
    try {
      const query = "UPDATE products SET features = ? WHERE id = ?";

      for (const product of products) {
        await executeQuery(query, [
          JSON.stringify(product.features),
          product.id,
        ]);
      }

      return true;
    } catch (error) {
      console.error("Error batch updating features:", error);
      throw new Error("Failed to batch update features");
    }
  }
}
