# Zamglam API Reference

Complete documentation of all REST API endpoints for the Zamglam e-commerce platform.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained via login endpoints and valid for 7 days.

---

## Authentication Endpoints

### Customer Signup

```
POST /auth/customer/signup
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "address": "123 Main Street, Lusaka",
  "phone": "+260123456789"
}
```

**Response (201 Created):**
```json
{
  "message": "Customer registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

**Errors:**
- `400`: Missing required fields
- `409`: Email already registered

---

### Customer Login

```
POST /auth/customer/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

**Errors:**
- `401`: Invalid credentials

---

### Seller Signup

```
POST /auth/seller/signup
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@shop.com",
  "password": "password123",
  "shop_name": "Jane's Boutique",
  "phone": "+260987654321"
}
```

**Response (201 Created):**
```json
{
  "message": "Seller registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@shop.com",
    "role": "seller",
    "shop_name": "Jane's Boutique"
  }
}
```

**Errors:**
- `400`: Missing required fields
- `409`: Email already registered

---

### Seller Login

```
POST /auth/seller/login
```

**Request Body:**
```json
{
  "email": "jane@shop.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@shop.com",
    "role": "seller",
    "shop_name": "Jane's Boutique"
  }
}
```

**Errors:**
- `401`: Invalid credentials

---

## Product Endpoints

### List All Products

```
GET /products
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `category` (optional): Filter by category

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "seller_id": 1,
    "name": "Classic White Tee",
    "description": "Comfortable 100% cotton t-shirt",
    "price": 120.00,
    "stock": 50,
    "image_url": "https://example.com/tee.jpg",
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "seller_id": 2,
    "name": "Denim Jacket",
    "description": "Classic blue denim jacket",
    "price": 350.00,
    "stock": 25,
    "image_url": "https://example.com/jacket.jpg",
    "created_at": "2024-01-14T08:15:00Z"
  }
]
```

---

### Get Product Details

```
GET /products/:id
```

**Response (200 OK):**
```json
{
  "id": 1,
  "seller_id": 1,
  "seller_name": "Jane's Boutique",
  "name": "Classic White Tee",
  "description": "Comfortable 100% cotton t-shirt",
  "price": 120.00,
  "stock": 50,
  "image_url": "https://example.com/tee.jpg",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `404`: Product not found

---

### Create Product (Seller Only)

```
POST /products
Authorization: Bearer <seller_token>
```

**Request Body:**
```json
{
  "name": "Summer Dress",
  "description": "Lightweight floral summer dress",
  "price": 280.00,
  "stock": 30,
  "image_url": "https://example.com/dress.jpg"
}
```

**Response (201 Created):**
```json
{
  "message": "Product created successfully",
  "product": {
    "id": 5,
    "seller_id": 1,
    "name": "Summer Dress",
    "description": "Lightweight floral summer dress",
    "price": 280.00,
    "stock": 30,
    "image_url": "https://example.com/dress.jpg",
    "created_at": "2024-01-20T14:22:00Z"
  }
}
```

**Errors:**
- `400`: Invalid data
- `401`: Unauthorized
- `403`: Forbidden (not a seller)

---

### Update Product (Seller Only)

```
PUT /products/:id
Authorization: Bearer <seller_token>
```

**Request Body (all fields optional):**
```json
{
  "name": "Summer Dress - Updated",
  "description": "Updated description",
  "price": 290.00,
  "stock": 25
}
```

**Response (200 OK):**
```json
{
  "message": "Product updated successfully",
  "product": {
    "id": 5,
    "seller_id": 1,
    "name": "Summer Dress - Updated",
    "description": "Updated description",
    "price": 290.00,
    "stock": 25,
    "image_url": "https://example.com/dress.jpg",
    "created_at": "2024-01-20T14:22:00Z",
    "updated_at": "2024-01-20T15:45:00Z"
  }
}
```

**Errors:**
- `403`: Not product owner
- `404`: Product not found

---

### Delete Product (Seller Only)

```
DELETE /products/:id
Authorization: Bearer <seller_token>
```

**Response (200 OK):**
```json
{
  "message": "Product deleted successfully"
}
```

**Errors:**
- `403`: Not product owner
- `404`: Product not found

---

### Get Seller's Products

```
GET /products/seller/my-products
Authorization: Bearer <seller_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Classic White Tee",
    "price": 120.00,
    "stock": 50,
    "image_url": "https://example.com/tee.jpg"
  },
  {
    "id": 3,
    "name": "Black Jeans",
    "price": 250.00,
    "stock": 35,
    "image_url": "https://example.com/jeans.jpg"
  }
]
```

---

## Order Endpoints

### Place Order (Customer Only)

```
POST /orders
Authorization: Bearer <customer_token>
```

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

**Response (201 Created):**
```json
{
  "message": "Order placed successfully",
  "order": {
    "id": 101,
    "customer_id": 5,
    "product_id": 1,
    "quantity": 2,
    "status": "pending",
    "created_at": "2024-01-20T16:30:00Z"
  }
}
```

**Errors:**
- `400`: Invalid product or quantity
- `401`: Unauthorized
- `403`: Forbidden (not a customer)
- `409`: Insufficient stock

---

### Get Customer Orders

```
GET /orders/my-orders
Authorization: Bearer <customer_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 101,
    "product_id": 1,
    "product_name": "Classic White Tee",
    "quantity": 2,
    "price": 120.00,
    "status": "pending",
    "created_at": "2024-01-20T16:30:00Z"
  },
  {
    "id": 102,
    "product_id": 3,
    "product_name": "Black Jeans",
    "quantity": 1,
    "price": 250.00,
    "status": "delivered",
    "created_at": "2024-01-19T10:15:00Z"
  }
]
```

---

### Update Order Status

```
PATCH /orders/:id/status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "processing"
}
```

**Valid Statuses:**
- `pending` - Order received
- `processing` - Being prepared
- `shipped` - On the way
- `delivered` - Delivered
- `cancelled` - Cancelled

**Response (200 OK):**
```json
{
  "message": "Order status updated successfully",
  "order": {
    "id": 101,
    "status": "processing",
    "updated_at": "2024-01-20T17:00:00Z"
  }
}
```

---

## Cart Endpoints

### Get Cart Items

```
GET /cart
Authorization: Bearer <customer_token>
```

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Classic White Tee",
      "price": 120.00,
      "quantity": 2,
      "total": 240.00
    },
    {
      "id": 2,
      "product_id": 3,
      "product_name": "Black Jeans",
      "price": 250.00,
      "quantity": 1,
      "total": 250.00
    }
  ],
  "cart_total": 490.00,
  "item_count": 2
}
```

---

### Add Item to Cart

```
POST /cart/add
Authorization: Bearer <customer_token>
```

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

**Response (201 Created):**
```json
{
  "message": "Item added to cart",
  "cart_item": {
    "id": 1,
    "product_id": 1,
    "product_name": "Classic White Tee",
    "price": 120.00,
    "quantity": 2,
    "total": 240.00
  }
}
```

**Errors:**
- `400`: Invalid product or quantity
- `404`: Product not found
- `409`: Insufficient stock

---

### Remove Item from Cart

```
DELETE /cart/remove/:item_id
Authorization: Bearer <customer_token>
```

**Response (200 OK):**
```json
{
  "message": "Item removed from cart",
  "cart_total": 250.00,
  "item_count": 1
}
```

**Errors:**
- `404`: Cart item not found

---

## Delivery/Courier Endpoints

### Get Delivery Quote

```
POST /courier/quote
Authorization: Bearer <customer_token>
```

**Request Body:**
```json
{
  "product_id": 1,
  "delivery_address": "123 Main Street, Lusaka"
}
```

**Response (200 OK):**
```json
{
  "quote": {
    "product_id": 1,
    "driver_name": "James Mwale",
    "price": 15.00,
    "distance": "3.5 km",
    "direction": "South",
    "estimated_delivery": "2024-01-21T14:00:00Z"
  }
}
```

**Errors:**
- `400`: Invalid product or address
- `404`: Product not found
- `503`: Courier service unavailable

---

## Error Response Format

All errors follow this format:

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

**Common HTTP Status Codes:**
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is enforced, but should be added in production.

Suggested limits:
- Login: 5 requests per 15 minutes per IP
- API calls: 1000 requests per hour per user

---

## Authentication Best Practices

1. **Store token securely** in localStorage or sessionStorage
2. **Include token in every protected request** via Authorization header
3. **Handle 401 responses** by redirecting to login
4. **Refresh tokens** before expiry (optional feature to implement)
5. **Log out** by deleting the stored token

---

## Example Usage with Curl

### Sign up customer
```bash
curl -X POST http://localhost:5000/api/auth/customer/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "address": "123 Main Street",
    "phone": "+260123456789"
  }'
```

### Get all products
```bash
curl http://localhost:5000/api/products
```

### Place an order (with token)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "product_id": 1,
    "quantity": 2
  }'
```

### Get delivery quote
```bash
curl -X POST http://localhost:5000/api/courier/quote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "product_id": 1,
    "delivery_address": "456 Oak Avenue, Lusaka"
  }'
```

---

## Postman Collection

Import the API endpoints into Postman for easier testing:
- Set base URL variable: `{{base_url}}` = `http://localhost:5000/api`
- Set token variable: `{{token}}` = from login response
- All protected endpoints should use `Authorization: Bearer {{token}}`

---

**API Version:** 1.0  
**Last Updated:** 2024  
**Status:** Stable
