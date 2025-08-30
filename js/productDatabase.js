
class ProductDatabase {
    constructor() {
        this.products = [
            {
                id: 1,
                name: "Wireless Bluetooth Headphones",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
                price: "$99.99"
            },
            {
                id: 2,
                name: "Smart Watch",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&h=300&fit=crop",
                price: "$199.99"
            },
            {
                id: 3,
                name: "Laptop Computer",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop",
                price: "$899.99"
            },
            {
                id: 4,
                name: "Modern Office Chair",
                category: "Furniture",
                image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
                price: "$299.99"
            },
            {
                id: 5,
                name: "Coffee Maker",
                category: "Kitchen",
                image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop",
                price: "$79.99"
            },
            {
                id: 6,
                name: "Smartphone",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop",
                price: "$699.99"
            },
            {
                id: 7,
                name: "Indoor Plant Pot",
                category: "Home & Garden",
                image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop",
                price: "$24.99"
            },
            {
                id: 8,
                name: "Desk Lamp",
                category: "Home & Garden",
                image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&h=300&fit=crop",
                price: "$45.99"
            },
            {
                id: 9,
                name: "Wireless Mouse",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop",
                price: "$29.99"
            },
            {
                id: 10,
                name: "Kitchen Blender",
                category: "Kitchen",
                image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&h=300&fit=crop",
                price: "$119.99"
            },
            {
                id: 11,
                name: "Gaming Console",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop",
                price: "$499.99"
            },
            {
                id: 12,
                name: "Bookshelf",
                category: "Furniture",
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
                price: "$149.99"
            },
            {
                id: 13,
                name: "Air Purifier",
                category: "Home & Garden",
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
                price: "$179.99"
            },
            {
                id: 14,
                name: "Wireless Earbuds",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300&h=300&fit=crop",
                price: "$149.99"
            },
            {
                id: 15,
                name: "Standing Desk",
                category: "Furniture",
                image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop",
                price: "$399.99"
            },
            {
                id: 16,
                name: "Smart Speaker",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=300&h=300&fit=crop",
                price: "$89.99"
            },
            {
                id: 17,
                name: "Throw Pillow",
                category: "Home & Garden",
                image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
                price: "$19.99"
            },
            {
                id: 18,
                name: "Monitor",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop",
                price: "$299.99"
            },
            {
                id: 19,
                name: "Table Lamp",
                category: "Home & Garden",
                image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=300&h=300&fit=crop",
                price: "$59.99"
            },
            {
                id: 20,
                name: "Mechanical Keyboard",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=300&fit=crop",
                price: "$129.99"
            },
            {
                id: 21,
                name: "Coffee Table",
                category: "Furniture",
                image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
                price: "$199.99"
            },
            {
                id: 22,
                name: "Tablet",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop",
                price: "$349.99"
            },
            {
                id: 23,
                name: "Wall Clock",
                category: "Home & Garden",
                image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=300&h=300&fit=crop",
                price: "$39.99"
            },
            {
                id: 24,
                name: "Electric Kettle",
                category: "Kitchen",
                image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=300&fit=crop",
                price: "$49.99"
            },
            {
                id: 25,
                name: "Webcam",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=300&h=300&fit=crop",
                price: "$79.99"
            },
            {
                id: 26,
                name: "Desk Organizer",
                category: "Home & Garden",
                image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
                price: "$34.99"
            },
            {
                id: 27,
                name: "Bluetooth Speaker",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop",
                price: "$59.99"
            },
            {
                id: 28,
                name: "Area Rug",
                category: "Home & Garden",
                image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=300&h=300&fit=crop",
                price: "$89.99"
            },
            {
                id: 29,
                name: "Food Processor",
                category: "Kitchen",
                image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop",
                price: "$159.99"
            },
            {
                id: 30,
                name: "Router",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=300&h=300&fit=crop",
                price: "$119.99"
            },
            {
                id: 31,
                name: "Mirror",
                category: "Home & Garden",
                image: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=300&h=300&fit=crop",
                price: "$79.99"
            },
            {
                id: 32,
                name: "Power Bank",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1609592424979-f30d4b6ce4d8?w=300&h=300&fit=crop",
                price: "$39.99"
            },
            {
                id: 33,
                name: "Dining Chair",
                category: "Furniture",
                image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=300&h=300&fit=crop",
                price: "$89.99"
            },
            {
                id: 34,
                name: "Microwave",
                category: "Kitchen",
                image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=300&h=300&fit=crop",
                price: "$129.99"
            },
            {
                id: 35,
                name: "USB Cable",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
                price: "$12.99"
            },
            {
                id: 36,
                name: "Curtains",
                category: "Home & Garden",
                image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
                price: "$49.99"
            },
            {
                id: 37,
                name: "External Hard Drive",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300&h=300&fit=crop",
                price: "$79.99"
            },
            {
                id: 38,
                name: "Side Table",
                category: "Furniture",
                image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
                price: "$119.99"
            },
            {
                id: 39,
                name: "Toaster",
                category: "Kitchen",
                image: "https://images.unsplash.com/photo-1541781408260-3c61143b63d5?w=300&h=300&fit=crop",
                price: "$69.99"
            },
            {
                id: 40,
                name: "Camera",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=300&fit=crop",
                price: "$599.99"
            },
            {
                id: 41,
                name: "Vacuum Cleaner",
                category: "Home & Garden",
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
                price: "$199.99"
            },
            {
                id: 42,
                name: "Gaming Headset",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1599669454699-248893623440?w=300&h=300&fit=crop",
                price: "$79.99"
            },
            {
                id: 43,
                name: "Bar Stool",
                category: "Furniture",
                image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
                price: "$69.99"
            },
            {
                id: 44,
                name: "Rice Cooker",
                category: "Kitchen",
                image: "https://images.unsplash.com/photo-1585515656643-808607a542e2?w=300&h=300&fit=crop",
                price: "$89.99"
            },
            {
                id: 45,
                name: "Fitness Tracker",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=300&h=300&fit=crop",
                price: "$149.99"
            },
            {
                id: 46,
                name: "Floor Lamp",
                category: "Home & Garden",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
                price: "$89.99"
            },
            {
                id: 47,
                name: "Graphics Tablet",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
                price: "$199.99"
            },
            {
                id: 48,
                name: "Ottoman",
                category: "Furniture",
                image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
                price: "$129.99"
            },
            {
                id: 49,
                name: "Stand Mixer",
                category: "Kitchen",
                image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop",
                price: "$249.99"
            },
            {
                id: 50,
                name: "Drone",
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=300&h=300&fit=crop",
                price: "$399.99"
            }
        ];
    }

    /**
     * Get all products
     * @returns {Array} Array of all products
     */
    getAllProducts() {
        return this.products;
    }

    /**
     * Get products by category
     * @param {string} category - Product category to filter by
     * @returns {Array} Array of filtered products
     */
    getProductsByCategory(category) {
        if (!category) return this.products;
        return this.products.filter(product => product.category === category);
    }

    /**
     * Get unique categories
     * @returns {Array} Array of unique category names
     */
    getCategories() {
        return [...new Set(this.products.map(product => product.category))];
    }

    /**
     * Get product by ID
     * @param {number} id - Product ID
     * @returns {Object|null} Product object or null if not found
     */
    getProductById(id) {
        return this.products.find(product => product.id === id) || null;
    }

    /**
     * Add new product to database
     * @param {Object} product - Product object
     * @returns {boolean} Success status
     */
    addProduct(product) {
        try {
            const newId = Math.max(...this.products.map(p => p.id)) + 1;
            const newProduct = { ...product, id: newId };
            this.products.push(newProduct);
            return true;
        } catch (error) {
            console.error('Error adding product:', error);
            return false;
        }
    }

    /**
     * Get product count
     * @returns {number} Total number of products
     */
    getProductCount() {
        return this.products.length;
    }
}

// Initialize global product database instance
const productDatabase = new ProductDatabase();