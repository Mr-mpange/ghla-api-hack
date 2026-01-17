const db = require('../config/database');
const ghalaService = require('./ghalaService');
const { redis } = require('../config/redis');

class ProductService {
  // Get products with filters
  async getProducts(filters = {}) {
    try {
      const { 
        category, 
        limit = 20, 
        offset = 0, 
        popular = false, 
        inStock = true,
        priceMin,
        priceMax 
      } = filters;

      let query = `
        SELECT p.*, 
               CASE WHEN p.stock_quantity > 0 THEN true ELSE false END as in_stock
        FROM products p
        WHERE p.is_active = true
      `;
      
      const params = [];
      let paramIndex = 1;

      // Add filters
      if (category) {
        query += ` AND p.category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (inStock) {
        query += ` AND p.stock_quantity > 0`;
      }

      if (priceMin) {
        query += ` AND p.price >= $${paramIndex}`;
        params.push(priceMin);
        paramIndex++;
      }

      if (priceMax) {
        query += ` AND p.price <= $${paramIndex}`;
        params.push(priceMax);
        paramIndex++;
      }

      // Order by popularity or date
      if (popular) {
        query += ` ORDER BY p.popularity_score DESC, p.created_at DESC`;
      } else {
        query += ` ORDER BY p.created_at DESC`;
      }

      // Add pagination
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);
      return result.rows;

    } catch (error) {
      console.error('Error fetching products:', error.message);
      throw new Error('Failed to fetch products');
    }
  }

  // Get single product by ID
  async getProduct(productId) {
    try {
      const result = await db.query(`
        SELECT * FROM products 
        WHERE id = $1 AND is_active = true
      `, [productId]);

      if (result.rows.length === 0) {
        throw new Error('Product not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error fetching product:', error.message);
      throw new Error('Failed to fetch product');
    }
  }

  // Search products by name or description
  async searchProducts(query, limit = 10) {
    try {
      const searchQuery = `%${query.toLowerCase()}%`;
      
      const result = await db.query(`
        SELECT p.*, 
               CASE WHEN p.stock_quantity > 0 THEN true ELSE false END as in_stock,
               ts_rank(to_tsvector('english', p.name || ' ' || p.description), plainto_tsquery('english', $1)) as rank
        FROM products p
        WHERE p.is_active = true 
          AND (
            LOWER(p.name) LIKE $2 OR 
            LOWER(p.description) LIKE $2 OR
            to_tsvector('english', p.name || ' ' || p.description) @@ plainto_tsquery('english', $1)
          )
        ORDER BY rank DESC, p.popularity_score DESC
        LIMIT $3
      `, [query, searchQuery, limit]);

      return result.rows;
    } catch (error) {
      console.error('Error searching products:', error.message);
      throw new Error('Failed to search products');
    }
  }

  // Get product categories
  async getCategories() {
    try {
      // Check cache first
      const cacheKey = 'product_categories';
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const result = await db.query(`
        SELECT 
          category,
          COUNT(*) as product_count,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price
        FROM products 
        WHERE is_active = true AND category IS NOT NULL
        GROUP BY category
        ORDER BY product_count DESC
      `);

      const categories = result.rows;

      // Cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(categories));

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error.message);
      throw new Error('Failed to fetch categories');
    }
  }

  // Sync products from Ghala
  async syncProductsFromGhala() {
    try {
      console.log('🔄 Syncing products from Ghala...');
      
      const ghalaProducts = await ghalaService.getProducts();
      let syncedCount = 0;
      let updatedCount = 0;

      for (const ghalaProduct of ghalaProducts.data || ghalaProducts) {
        try {
          // Check if product exists
          const existingResult = await db.query(`
            SELECT id FROM products WHERE ghala_product_id = $1
          `, [ghalaProduct.id]);

          if (existingResult.rows.length > 0) {
            // Update existing product
            await db.query(`
              UPDATE products SET
                name = $1,
                description = $2,
                price = $3,
                stock_quantity = $4,
                category = $5,
                image_url = $6,
                updated_at = NOW()
              WHERE ghala_product_id = $7
            `, [
              ghalaProduct.name,
              ghalaProduct.description,
              ghalaProduct.price,
              ghalaProduct.stock_quantity || 0,
              ghalaProduct.category,
              ghalaProduct.image_url,
              ghalaProduct.id
            ]);
            updatedCount++;
          } else {
            // Create new product
            await db.query(`
              INSERT INTO products (
                ghala_product_id, name, description, price, currency,
                stock_quantity, category, image_url, is_active, 
                created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
            `, [
              ghalaProduct.id,
              ghalaProduct.name,
              ghalaProduct.description,
              ghalaProduct.price,
              ghalaProduct.currency || 'KES',
              ghalaProduct.stock_quantity || 0,
              ghalaProduct.category,
              ghalaProduct.image_url
            ]);
            syncedCount++;
          }
        } catch (productError) {
          console.error(`Error syncing product ${ghalaProduct.id}:`, productError.message);
        }
      }

      // Clear categories cache
      await redis.del('product_categories');

      console.log(`✅ Product sync complete: ${syncedCount} new, ${updatedCount} updated`);
      
      return {
        synced: syncedCount,
        updated: updatedCount,
        total: syncedCount + updatedCount
      };

    } catch (error) {
      console.error('Error syncing products from Ghala:', error.message);
      throw new Error('Failed to sync products from Ghala');
    }
  }

  // Update product stock
  async updateProductStock(productId, newStock) {
    try {
      const result = await db.query(`
        UPDATE products 
        SET stock_quantity = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [newStock, productId]);

      if (result.rows.length === 0) {
        throw new Error('Product not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating product stock:', error.message);
      throw new Error('Failed to update product stock');
    }
  }

  // Update product popularity (based on orders)
  async updateProductPopularity() {
    try {
      await db.query(`
        UPDATE products 
        SET popularity_score = subquery.order_count
        FROM (
          SELECT 
            oi.product_id,
            COUNT(*) as order_count
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.created_at >= NOW() - INTERVAL '30 days'
            AND o.status IN ('delivered', 'shipped', 'processing')
          GROUP BY oi.product_id
        ) AS subquery
        WHERE products.id = subquery.product_id
      `);

      console.log('✅ Product popularity scores updated');
      return true;
    } catch (error) {
      console.error('Error updating product popularity:', error.message);
      return false;
    }
  }

  // Get product recommendations for customer
  async getRecommendations(customerId, limit = 5) {
    try {
      // Get customer's order history to find preferences
      const result = await db.query(`
        SELECT DISTINCT p.*,
               COUNT(oi.id) as order_frequency
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.customer_id = $1 
          AND o.status = 'delivered'
          AND p.is_active = true
          AND p.stock_quantity > 0
        GROUP BY p.id
        ORDER BY order_frequency DESC, p.popularity_score DESC
        LIMIT $2
      `, [customerId, limit]);

      if (result.rows.length < limit) {
        // Fill with popular products if not enough personalized recommendations
        const popularResult = await db.query(`
          SELECT * FROM products
          WHERE is_active = true 
            AND stock_quantity > 0
            AND id NOT IN (
              SELECT DISTINCT oi.product_id
              FROM order_items oi
              JOIN orders o ON oi.order_id = o.id
              WHERE o.customer_id = $1
            )
          ORDER BY popularity_score DESC
          LIMIT $2
        `, [customerId, limit - result.rows.length]);

        return [...result.rows, ...popularResult.rows];
      }

      return result.rows;
    } catch (error) {
      console.error('Error getting product recommendations:', error.message);
      return await this.getProducts({ popular: true, limit });
    }
  }

  // Get low stock products (for admin alerts)
  async getLowStockProducts(threshold = 10) {
    try {
      const result = await db.query(`
        SELECT * FROM products
        WHERE is_active = true 
          AND stock_quantity <= $1
          AND stock_quantity > 0
        ORDER BY stock_quantity ASC
      `, [threshold]);

      return result.rows;
    } catch (error) {
      console.error('Error fetching low stock products:', error.message);
      throw new Error('Failed to fetch low stock products');
    }
  }

  // Get product analytics
  async getProductAnalytics(productId, dateRange = {}) {
    try {
      const { 
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
        endDate = new Date() 
      } = dateRange;

      const result = await db.query(`
        SELECT 
          p.name,
          p.price,
          p.stock_quantity,
          COUNT(oi.id) as total_orders,
          SUM(oi.quantity) as total_quantity_sold,
          SUM(oi.total_price) as total_revenue,
          AVG(oi.quantity) as avg_quantity_per_order,
          COUNT(DISTINCT o.customer_id) as unique_customers
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at BETWEEN $2 AND $3
        WHERE p.id = $1
        GROUP BY p.id, p.name, p.price, p.stock_quantity
      `, [productId, startDate, endDate]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching product analytics:', error.message);
      throw new Error('Failed to fetch product analytics');
    }
  }

  // Cache frequently accessed products
  async cachePopularProducts() {
    try {
      const popularProducts = await this.getProducts({ popular: true, limit: 20 });
      const cacheKey = 'popular_products';
      
      await redis.setex(cacheKey, 1800, JSON.stringify(popularProducts)); // Cache for 30 minutes
      
      return popularProducts;
    } catch (error) {
      console.error('Error caching popular products:', error.message);
      return [];
    }
  }

  // Get cached popular products
  async getCachedPopularProducts() {
    try {
      const cacheKey = 'popular_products';
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // If not cached, fetch and cache
      return await this.cachePopularProducts();
    } catch (error) {
      console.error('Error getting cached popular products:', error.message);
      return await this.getProducts({ popular: true, limit: 20 });
    }
  }

  // Validate product availability for order
  async validateProductsForOrder(orderItems) {
    try {
      const validationResults = [];

      for (const item of orderItems) {
        const product = await this.getProduct(item.productId);
        
        const validation = {
          productId: item.productId,
          requestedQuantity: item.quantity,
          available: true,
          availableStock: product.stock_quantity,
          currentPrice: product.price,
          errors: []
        };

        if (!product.is_active) {
          validation.available = false;
          validation.errors.push('Product is no longer available');
        }

        if (product.stock_quantity < item.quantity) {
          validation.available = false;
          validation.errors.push(`Only ${product.stock_quantity} units available`);
        }

        if (product.price !== item.unitPrice) {
          validation.errors.push('Price has changed');
          validation.priceChanged = true;
        }

        validationResults.push(validation);
      }

      return validationResults;
    } catch (error) {
      console.error('Error validating products for order:', error.message);
      throw new Error('Failed to validate products for order');
    }
  }
}

module.exports = new ProductService();