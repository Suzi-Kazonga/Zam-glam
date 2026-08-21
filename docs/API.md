# Zamglam API Documentation

Complete API documentation for the Zamglam e-commerce backend.

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

All responses are in JSON format:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer"  // or "seller"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

---

### Login

**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "role": "customer"
  }
}
```

---

### Get Current User

**GET** `/auth/me`

Get information about the logged-in user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "customer"
}
```

---

## Store Endpoints

### Get All Stores

**GET** `/stores`

Retrieve all active stores.

**Response (200):**
```json
[
  {
    "id": 1,
    "seller_id": 2,
    "name": "PEP Zambia",
    "location": "Lusaka, Zambia",
    "status": "open"
  }
]
```

---

### Get Store Details

**GET** `/stores/:id`

Get detailed information about a specific store.

---

### Create Store

**POST** `/stores`

Create a new store (Seller only).

**Headers:**
```
Authorization: Bearer <seller_token>
```

---

### Update Store

**PUT** `/stores/:id`

Update store information (Seller only).

**Headers:**
```
Authorization: Bearer <seller_token>
```

---

### Get Store Products

**GET** `/stores/:id/products?audience=women&category=2`

Get filtered products from a store.

**Query Parameters:**
- `audience` (optional) - 'men', 'women', 'children', 'unisex'
- `category` (optional) - Category ID

---

## Product Endpoints

### Get Products

**GET** `/products?audience=women&category_id=2`

Get products with filters.

---

### Get Product Details

**GET** `/products/:id`

Get a specific product.

---

### Create Product

**POST** `/products`

Create a new product (Seller only).

---

### Update Product

**PUT** `/products/:id`

Update a product (Seller only).

---

### Delete Product

**DELETE** `/products/:id`

Delete a product (Seller only).

---

## Courier Service

### Get Delivery Quote

**POST** `/courier/quote`

Calculate delivery price.

**Request:**
```json
{
  "pickup_lat": -15.3875,
  "pickup_lon": 28.3228,
  "delivery_lat": -15.4167,
  "delivery_lon": 28.2833
}
```

**Response:**
```json
{
  "distance_km": 5.42,
  "total_price": 47.10,
  "currency": "ZMW"
}
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pep@zamglam.local","password":"PEP123456"}'
```

### Get All Stores
```bash
curl http://localhost:5000/api/stores
```

### Get Products by Filter
```bash
curl "http://localhost:5000/api/products?audience=women&category_id=2"
```

---

## Error Codes

- 400 - Bad Request
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 500 - Server Error

**Response:**
```json
{
    "success": true,
    "message": "Server is running",
    "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### Items

#### Get All Items

```http
GET /api/items
```

**Response:**
```json
{
    "success": true,
    "count": 2,
    "data": [
        {
            "id": "1",
            "name": "Sample Item",
            "createdAt": "2025-01-15T10:30:00.000Z"
        }
    ]
}
```

---

#### Get Single Item

```http
GET /api/items/:id
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Item ID |

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "1",
        "name": "Sample Item",
        "createdAt": "2025-01-15T10:30:00.000Z"
    }
}
```

**Response (404):**
```json
{
    "success": false,
    "error": "Item not found"
}
```

---

#### Create Item

```http
POST /api/items
```

**Body:**
```json
{
    "name": "New Item"
}
```

**Response (201):**
```json
{
    "success": true,
    "data": {
        "id": "3",
        "name": "New Item",
        "createdAt": "2025-01-15T10:30:00.000Z"
    }
}
```

**Response (400):**
```json
{
    "success": false,
    "error": "Name is required"
}
```

---

#### Update Item

```http
PUT /api/items/:id
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Item ID |

**Body:**
```json
{
    "name": "Updated Name"
}
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "1",
        "name": "Updated Name",
        "createdAt": "2025-01-15T10:30:00.000Z",
        "updatedAt": "2025-01-15T11:00:00.000Z"
    }
}
```

---

#### Delete Item

```http
DELETE /api/items/:id
```

**Response (204):** No content

**Response (404):**
```json
{
    "success": false,
    "error": "Item not found"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
    "success": false,
    "error": "Error message description"
}
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 204 | No Content - Resource deleted |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal error |

---

## TODO: Document Your Endpoints

Add documentation for all your custom endpoints following the format above.
