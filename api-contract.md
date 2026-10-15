# ShopSphere — API Contract

| Field               | Value                                  |
| ------------------- | -------------------------------------- |
| Version             | 1.0                                    |
| Date                | 01 September 2026                      |
| Status              | Agreed — changes require team sign-off |
| Companion documents | `SRS.md`, `service-boundaries.md`      |

This is the working agreement between the three developers. Once a row here is agreed, the owning developer implements exactly this shape and the consuming developer codes against it without waiting.

**Changing anything in this file requires telling the other two developers first.** A silent change to a response shape breaks someone else's Feign client or React page, and the failure appears far from the cause.

---

## 1. Conventions

### 1.1 Base URL

Every client call goes to the gateway:

```
http://localhost:8080
```

No React code, Postman collection, or test ever references ports 8081–8088 directly. This is constraint C-5 in the SRS and the evaluator will check it.

### 1.2 Authentication

Protected endpoints require:

```
Authorization: Bearer <jwt>
```

The gateway validates the token, then forwards two headers to the downstream service:

| Header        | Contents                               |
| ------------- | -------------------------------------- |
| `X-User-Id`   | Numeric user identifier from the token |
| `X-User-Role` | `CUSTOMER` or `ADMIN`                  |

Downstream services trust these headers and do not re-parse the JWT. This is why nothing but the gateway may be publicly reachable — a service that trusts `X-User-Id` and is directly callable has no security at all.

### 1.3 Access levels used in this document

| Level    | Meaning                                                                         |
| -------- | ------------------------------------------------------------------------------- |
| Public   | No token required                                                               |
| Customer | Valid token, any role                                                           |
| Admin    | Valid token with role `ADMIN`                                                   |
| Internal | Service-to-service only. **Not routed by the gateway.** Callable only via Feign |

### 1.4 Standard error envelope

Every error from every service, produced by the shared `GlobalExceptionHandler` in `common-lib`:

```json
{
  "timestamp": "2026-09-01T14:32:10.482",
  "status": 400,
  "error": "Validation Failed",
  "message": "One or more fields are invalid",
  "path": "/api/users/register",
  "fieldErrors": {
    "email": "must be a well-formed email address",
    "phone": "must be 10 digits"
  }
}
```

`fieldErrors` is present only on 400 responses from bean validation. Everything else omits it.

### 1.5 Status codes

| Code | Used when                                                        |
| ---- | ---------------------------------------------------------------- |
| 200  | Successful read, update, or delete                               |
| 201  | Resource created                                                 |
| 400  | Bean validation failure, or a business rule rejected the input   |
| 401  | Token missing, malformed, or expired                             |
| 403  | Valid token, insufficient role, or accessing another user's data |
| 404  | Resource does not exist                                          |
| 409  | Conflict — duplicate email, duplicate review, already-paid order |
| 500  | Unhandled server error                                           |

### 1.6 Pagination

Paginated endpoints accept `page` (0-based, default 0) and `size` (default 12, max 100), and return:

```json
{
  "content": [],
  "page": 0,
  "size": 12,
  "totalElements": 148,
  "totalPages": 13,
  "last": false
}
```

### 1.7 Money and dates

Monetary values are JSON numbers with two decimal places, backed by `BigDecimal` in Java and `DECIMAL(10,2)` in MySQL. Never `float` or `double`.

Timestamps are ISO-8601 without timezone: `2026-09-01T14:32:10`.

---

## 2. Auth Service — port 8082

Prefix `/api/auth`. Owner: **Dev A**.

| Method | Path                             | Access   | Purpose                               | Requirement |
| ------ | -------------------------------- | -------- | ------------------------------------- | ----------- |
| POST   | `/api/auth/login`                | Public   | Authenticate, issue JWT               | FR-AUTH-01  |
| POST   | `/api/auth/change-password`      | Customer | Change own password                   | FR-AUTH-06  |
| POST   | `/api/auth/logout`               | Customer | Client-side token discard             | FR-AUTH-07  |
| POST   | `/api/auth/internal/credentials` | Internal | Create credential row on registration | FR-AUTH-05  |
| POST   | `/api/auth/internal/validate`    | Internal | Validate token, return claims         | FR-AUTH-04  |

### POST `/api/auth/login`

Request:

```json
{ "email": "priya@example.com", "password": "Secret@123" }
```

Response `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 7,
  "email": "priya@example.com",
  "firstName": "Priya",
  "role": "CUSTOMER",
  "expiresIn": 3600
}
```

401 on bad credentials. The message is deliberately generic — "Invalid email or password" — and never reveals which one was wrong (FR-AUTH-03).

firstName in this response is Auth's own snapshot, not a live read from the Registration Service.

### POST `/api/auth/change-password`

```json
{ "currentPassword": "Secret@123", "newPassword": "NewSecret@456" }
```

`200` on success, `400` if the current password is wrong.

### POST `/api/auth/internal/credentials`

Called by the Registration Service during signup. Auth owns password hashing; Registration never sees or stores a password.

```json
{
  "userId": 7,
  "email": "priya@example.com",
  "firstName": "Priya",
  "password": "Secret@123",
  "role": "CUSTOMER"
}
```

`201` on success, `409` if credentials already exist for that email.

---

## 3. Registration Service — port 8081

Prefix `/api/users`. Owner: **Dev A**.

| Method | Path                                                 | Access   | Purpose                           | Requirement          |
| ------ | ---------------------------------------------------- | -------- | --------------------------------- | -------------------- |
| POST   | `/api/users/register`                                | Public   | Create account                    | FR-REG-01            |
| GET    | `/api/users/me`                                      | Customer | Own profile                       | FR-REG-05            |
| PUT    | `/api/users/me`                                      | Customer | Update own profile                | FR-REG-05            |
| GET    | `/api/users/me/addresses`                            | Customer | List own addresses                | FR-REG-06            |
| POST   | `/api/users/me/addresses`                            | Customer | Add address                       | FR-REG-06            |
| PUT    | `/api/users/me/addresses/{addressId}`                | Customer | Edit address                      | FR-REG-06            |
| DELETE | `/api/users/me/addresses/{addressId}`                | Customer | Delete address                    | FR-REG-06, FR-REG-08 |
| PATCH  | `/api/users/me/addresses/{addressId}/default`        | Customer | Set default                       | FR-REG-07            |
| GET    | `/api/users/internal/{userId}`                       | Internal | Name and email for other services | —                    |
| GET    | `/api/users/internal/{userId}/addresses/{addressId}` | Internal | Address snapshot for Order        | FR-ORD-02            |

### POST `/api/users/register`

```json
{
  "firstName": "Priya",
  "lastName": "Sharma",
  "email": "priya@example.com",
  "password": "Secret@123",
  "phone": "9876543210"
}
```

Validation rules — implement all of these, they are directly graded under parameter #8:

| Field       | Rule                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------- |
| `firstName` | Not blank, 2–50 characters                                                               |
| `lastName`  | Not blank, 2–50 characters                                                               |
| `email`     | Not blank, valid email format, unique                                                    |
| `password`  | 8–64 characters, at least one uppercase, one lowercase, one digit, one special character |
| `phone`     | Exactly 10 digits                                                                        |

Response `201`:

```json
{
  "userId": 7,
  "firstName": "Priya",
  "lastName": "Sharma",
  "email": "priya@example.com",
  "phone": "9876543210"
}
```

`409` if the email already exists (FR-REG-02). `400` with `fieldErrors` on validation failure.

### GET `/api/users/me`, PUT `/api/users/me`

Both return the shared `UserDto` shape. Note the key is `id`, not `userId` —
unlike the register response, which predates it.

```json
{
  "id": 7,
  "firstName": "Priya",
  "lastName": "Sharma",
  "email": "priya@example.com",
  "phone": "9876543210"
}
```

`PUT` accepts `firstName`, `lastName` and `phone` only. **The email address is
not updatable.** It is the sign-in identifier and Auth holds its own snapshot of
it (DR-10); changing it here alone would leave the customer unable to log in,
and there is no distributed transaction to make the pair atomic. Same rules as
signup: names 2–50 characters, phone exactly 10 digits.

`GET /api/users/internal/{userId}` returns the same shape, for Review and Order.

### Address endpoints

`POST` returns `201`, `PUT` and `PATCH` return `200`, `DELETE` returns `204`
with no body. All five return or accept the `Address object` below.

`isDefault` is **not** accepted in the create or update body — promotion is
`PATCH .../default`, because making one address the default demotes another.
The first address a customer adds becomes their default automatically. Deleting
the current default promotes the oldest remaining address.

An address belonging to another customer returns `404`, never `403`: a 403
would confirm that the identifier exists.

### Address object

```json
{
  "addressId": 3,
  "line1": "42 MG Road",
  "line2": "Near Metro Station",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "pincode": "600001",
  "isDefault": true
}
```

`line1`, `city`, `state`, `pincode` required. Pincode exactly 6 digits.

`DELETE` returns `400` if it would remove the customer's only address (FR-REG-08).

---

## 4. Product Service — port 8083

Prefixes `/api/products` and `/api/categories`. Owner: **Dev B**.

| Method | Path                                | Access   | Purpose                                    | Requirement           |
| ------ | ----------------------------------- | -------- | ------------------------------------------ | --------------------- |
| GET    | `/api/products`                     | Public   | Browse, search, filter, sort, paginate     | FR-PRD-01, 03, 04, 05 |
| GET    | `/api/products/{id}`                | Public   | Product detail                             | FR-PRD-02             |
| POST   | `/api/products`                     | Admin    | Create product                             | FR-PRD-07             |
| PUT    | `/api/products/{id}`                | Admin    | Update product                             | FR-PRD-07             |
| DELETE | `/api/products/{id}`                | Admin    | Delete product                             | FR-PRD-07             |
| GET    | `/api/categories`                   | Public   | List categories                            | FR-PRD-06             |
| POST   | `/api/categories`                   | Admin    | Create category                            | FR-PRD-08             |
| PUT    | `/api/categories/{id}`              | Admin    | Update category                            | FR-PRD-08             |
| DELETE | `/api/categories/{id}`              | Admin    | Delete category                            | FR-PRD-08             |
| GET    | `/api/products/internal/{id}`       | Internal | Product snapshot for Cart, Wishlist, Order | FR-PRD-09             |
| PATCH  | `/api/products/internal/{id}/stock` | Internal | Decrement stock                            | FR-PRD-10             |

### GET `/api/products`

Query parameters, all optional and combinable:

| Param        | Type    | Default  | Notes                                         |
| ------------ | ------- | -------- | --------------------------------------------- |
| `keyword`    | string  | —        | Matches name or description, case-insensitive |
| `categoryId` | long    | —        | Exact category                                |
| `minPrice`   | decimal | —        | Inclusive                                     |
| `maxPrice`   | decimal | —        | Inclusive                                     |
| `inStock`    | boolean | —        | `true` returns only `stockQuantity > 0`       |
| `sort`       | string  | `newest` | `priceAsc`, `priceDesc`, `newest`             |
| `page`       | int     | 0        |                                               |
| `size`       | int     | 12       | Max 100                                       |

Example: `/api/products?keyword=laptop&categoryId=2&minPrice=30000&maxPrice=80000&sort=priceAsc&page=0&size=12`

Returns the paginated envelope from §1.6 with `content` holding product summaries.

### Product summary (list view)

```json
{
  "id": 15,
  "name": "ThinkPad X1 Carbon",
  "price": 145000.0,
  "imageUrl": "https://example.com/images/x1.jpg",
  "categoryName": "Laptops",
  "inStock": true,
  "averageRating": 4.3,
  "reviewCount": 27
}
```

`averageRating` and `reviewCount` come from the Review Service. **In list view these are omitted** (`null`) to avoid an N+1 call per product — the front end does not display ratings on cards. They are populated only on the detail endpoint.

### GET `/api/products/{id}` — product detail

```json
{
  "id": 15,
  "name": "ThinkPad X1 Carbon",
  "description": "14-inch business laptop, 16GB RAM, 512GB SSD",
  "price": 145000.0,
  "stockQuantity": 8,
  "imageUrl": "https://example.com/images/x1.jpg",
  "categoryId": 2,
  "categoryName": "Laptops",
  "createdAt": "2026-08-14T09:12:00"
}
```

`404` with a clear message if the product does not exist (FR-PRD-11).

Reviews are **not** embedded here. The React product page makes a second call to the Review Service. This keeps the boundary clean and is a good viva talking point.

### POST / PUT `/api/products`

```json
{
  "name": "ThinkPad X1 Carbon",
  "description": "14-inch business laptop",
  "price": 145000.0,
  "stockQuantity": 8,
  "imageUrl": "https://example.com/images/x1.jpg",
  "categoryId": 2
}
```

| Field           | Rule                              |
| --------------- | --------------------------------- |
| `name`          | Not blank, 3–150 characters       |
| `description`   | Not blank, max 2000 characters    |
| `price`         | Required, greater than 0          |
| `stockQuantity` | Required, zero or positive        |
| `categoryId`    | Required, must exist — else `400` |
| `imageUrl`      | Optional, valid URL if present    |

### PATCH `/api/products/internal/{id}/stock`

```json
{ "quantity": 2 }
```

Decrements by `quantity`. Returns `400` with a clear message if stock is insufficient (FR-PRD-10). Called by the Order Service only after payment succeeds.

---

## 5. Cart Service — port 8084

Prefix `/api/cart`. Owner: **Dev B**.

The cart is derived from `X-User-Id`. There is no `userId` in any request body or path — a customer can only ever touch their own cart (NFR-SEC-05).

| Method | Path                          | Access   | Purpose                             | Requirement        |
| ------ | ----------------------------- | -------- | ----------------------------------- | ------------------ |
| GET    | `/api/cart`                   | Customer | View own cart with totals           | FR-CART-01, 08     |
| POST   | `/api/cart/items`             | Customer | Add item                            | FR-CART-02, 03, 04 |
| PUT    | `/api/cart/items/{itemId}`    | Customer | Change quantity                     | FR-CART-05         |
| DELETE | `/api/cart/items/{itemId}`    | Customer | Remove item                         | FR-CART-06         |
| DELETE | `/api/cart`                   | Customer | Empty cart                          | FR-CART-07         |
| GET    | `/api/cart/internal/{userId}` | Internal | Cart contents for Order at checkout | FR-ORD-01          |
| DELETE | `/api/cart/internal/{userId}` | Internal | Clear cart after successful order   | FR-ORD-07          |

### GET `/api/cart`

```json
{
  "cartId": 4,
  "items": [
    {
      "itemId": 11,
      "productId": 15,
      "productName": "ThinkPad X1 Carbon",
      "unitPrice": 145000.0,
      "quantity": 2,
      "lineTotal": 290000.0,
      "imageUrl": "https://example.com/images/x1.jpg",
      "available": true
    }
  ],
  "itemCount": 2,
  "subtotal": 290000.0
}
```

`unitPrice` is refreshed from the Product Service on every read, so the cart always shows the current price. `available` is `false` if the product was deleted or is out of stock — the front end greys the row and blocks checkout.

### POST `/api/cart/items`

```json
{ "productId": 15, "quantity": 2 }
```

Behaviour:

- Calls Product Service to confirm existence and stock (FR-CART-03).
- `404` if the product does not exist.
- `400` if `quantity` is zero, negative, or exceeds stock (FR-CART-09).
- If the product is already in the cart, **increments** the existing line rather than adding a duplicate (FR-CART-04).

Returns `200` with the full cart body above.

---

## 6. Wishlist Service — port 8085

Prefix `/api/wishlist`. Owner: **Dev B**.

| Method | Path                                        | Access   | Purpose           | Requirement    |
| ------ | ------------------------------------------- | -------- | ----------------- | -------------- |
| GET    | `/api/wishlist`                             | Customer | View own wishlist | FR-WISH-03     |
| POST   | `/api/wishlist/items`                       | Customer | Add product       | FR-WISH-01, 02 |
| DELETE | `/api/wishlist/items/{itemId}`              | Customer | Remove item       | FR-WISH-04     |
| POST   | `/api/wishlist/items/{itemId}/move-to-cart` | Customer | Move to cart      | FR-WISH-05     |

### GET `/api/wishlist`

```json
{
  "items": [
    {
      "itemId": 6,
      "productId": 22,
      "productName": "Mechanical Keyboard",
      "price": 8500.0,
      "imageUrl": "https://example.com/images/kb.jpg",
      "inStock": true,
      "addedAt": "2026-08-28T18:04:00"
    }
  ],
  "itemCount": 1
}
```

Product fields are fetched live from the Product Service, never stored — a wishlist is a live view, unlike an order which is a historical record.

### POST `/api/wishlist/items`

```json
{ "productId": 22 }
```

`409` if the product is already in this wishlist (FR-WISH-02).

### POST `/api/wishlist/items/{itemId}/move-to-cart`

Adds to cart via the Cart Service, then removes from the wishlist. If the cart call fails, the wishlist item stays — no partial state.

---

## 7. Order Service — port 8086

Prefix `/api/orders`. Owner: **Dev C**.

| Method | Path                                  | Access   | Purpose                       | Requirement     |
| ------ | ------------------------------------- | -------- | ----------------------------- | --------------- |
| POST   | `/api/orders`                         | Customer | Checkout                      | FR-ORD-01 to 07 |
| GET    | `/api/orders`                         | Customer | Own order history             | FR-ORD-09       |
| GET    | `/api/orders/{id}`                    | Customer | Order detail and tracking     | FR-ORD-10       |
| PATCH  | `/api/orders/{id}/cancel`             | Customer | Cancel before shipping        | FR-ORD-11       |
| GET    | `/api/orders/admin/all`               | Admin    | All orders, paginated         | FR-ORD-12       |
| PATCH  | `/api/orders/admin/{id}/status`       | Admin    | Advance status                | FR-ORD-12       |
| GET    | `/api/orders/internal/purchase-check` | Internal | Did user X receive product Y? | FR-REV-02       |

### POST `/api/orders` — checkout

```json
{ "addressId": 3, "paymentMethod": "UPI" }
```

`paymentMethod` is one of `CARD`, `UPI`, `NET_BANKING`, `CASH_ON_DELIVERY`.

The full orchestration is in the checkout sequence diagram in `service-boundaries.md`. Summary of failure responses:

| Condition                       | Status | Message                                                         |
| ------------------------------- | ------ | --------------------------------------------------------------- |
| Cart empty                      | 400    | Your cart is empty                                              |
| Address not found or not owned  | 400    | Selected address is invalid                                     |
| Stock insufficient for any line | 400    | _Product name_ is no longer available in the requested quantity |
| Payment declined                | 402    | Payment failed. Your order has not been placed                  |
| Product service unreachable     | 503    | Unable to verify product availability. Please try again         |

Response `201`:

```json
{
  "orderId": 31,
  "status": "CONFIRMED",
  "totalAmount": 290000.0,
  "placedAt": "2026-09-01T14:32:10",
  "paymentStatus": "SUCCESS",
  "transactionRef": "TXN-8F2A91C4",
  "deliveryAddress": {
    "line1": "42 MG Road",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pincode": "600001"
  },
  "items": [
    {
      "productId": 15,
      "productName": "ThinkPad X1 Carbon",
      "unitPrice": 145000.0,
      "quantity": 2,
      "lineTotal": 290000.0
    }
  ]
}
```

The address is **copied** into the order, not referenced. If the customer later edits or deletes that address, the order still shows where it was actually shipped. Same reasoning as `productName` and `unitPrice` (DR-04).

### GET `/api/orders`

Paginated, reverse chronological (FR-ORD-09). `content` holds summaries:

```json
{
  "orderId": 31,
  "status": "CONFIRMED",
  "totalAmount": 290000.0,
  "itemCount": 2,
  "placedAt": "2026-09-01T14:32:10"
}
```

### PATCH `/api/orders/{id}/cancel`

`400` if the order is already `SHIPPED`, `DELIVERED`, or `CANCELLED` (FR-ORD-11). Restores stock on success.

### PATCH `/api/orders/admin/{id}/status`

```json
{ "status": "SHIPPED" }
```

Valid transitions — reject anything else with `400`:

```
PENDING    → CONFIRMED, CANCELLED
CONFIRMED  → SHIPPED, CANCELLED
SHIPPED    → DELIVERED
DELIVERED  → (terminal)
CANCELLED  → (terminal)
```

### GET `/api/orders/internal/purchase-check?userId=7&productId=15`

```json
{ "purchased": true, "orderId": 31, "deliveredAt": "2026-09-04T11:00:00" }
```

Returns `purchased: true` only if a **DELIVERED** order exists containing that product. Used by the Review Service to enforce FR-REV-02.

---

## 8. Payment Service — port 8087

Prefix `/api/payments`. Owner: **Dev C**.

| Method | Path                            | Access   | Purpose                      | Requirement     |
| ------ | ------------------------------- | -------- | ---------------------------- | --------------- |
| POST   | `/api/payments/internal`        | Internal | Process payment for an order | FR-PAY-01 to 06 |
| GET    | `/api/payments/order/{orderId}` | Customer | View payment for own order   | FR-PAY-07       |

### POST `/api/payments/internal`

```json
{ "orderId": 31, "userId": 7, "amount": 290000.0, "paymentMethod": "UPI" }
```

Rules:

- Validates that `amount` matches the order total (FR-PAY-06). Mismatch → `400`.
- If a `SUCCESS` payment already exists for the order, returns `200` with that existing transaction rather than charging again (FR-PAY-05). This is idempotency and it is worth being able to explain.
- Every attempt is persisted, including failures (FR-PAY-04).
- `CASH_ON_DELIVERY` always returns `SUCCESS` with status `PENDING_COLLECTION`.

Simulation rule — keep it deterministic so your demo is repeatable rather than random:

> Payment succeeds unless the amount ends in `.99`, which returns `FAILURE` with reason `INSUFFICIENT_FUNDS`.

Seed one product priced to produce a `.99` total so you can demonstrate the failure path on demand.

Response `200`:

```json
{
  "paymentId": 44,
  "orderId": 31,
  "amount": 290000.0,
  "paymentMethod": "UPI",
  "status": "SUCCESS",
  "transactionRef": "TXN-8F2A91C4",
  "processedAt": "2026-09-01T14:32:11"
}
```

On failure, `status` is `FAILURE` and a `failureReason` field is present. Note this is still HTTP `200` — the payment attempt was processed successfully, it just didn't authorise. The Order Service reads `status`, not the HTTP code, and returns `402` to the client.

---

## 9. Review Service — port 8088

Prefix `/api/reviews`. Owner: **Dev B**.

| Method | Path                                       | Access   | Purpose                   | Requirement       |
| ------ | ------------------------------------------ | -------- | ------------------------- | ----------------- |
| GET    | `/api/reviews/product/{productId}`         | Public   | All reviews for a product | FR-REV-04         |
| GET    | `/api/reviews/product/{productId}/summary` | Public   | Average rating and count  | FR-REV-05         |
| POST   | `/api/reviews`                             | Customer | Submit review             | FR-REV-01, 02, 03 |
| PUT    | `/api/reviews/{id}`                        | Customer | Edit own review           | FR-REV-06         |
| DELETE | `/api/reviews/{id}`                        | Customer | Delete own review         | FR-REV-06         |
| GET    | `/api/reviews/me`                          | Customer | Own reviews               | —                 |

### POST `/api/reviews`

```json
{
  "productId": 15,
  "rating": 5,
  "comment": "Excellent build quality, battery lasts all day."
}
```

| Field       | Rule                          |
| ----------- | ----------------------------- |
| `rating`    | Required, integer 1–5         |
| `comment`   | Optional, max 1000 characters |
| `productId` | Required, must exist          |

Rejections:

- `403` if the purchase check fails — "You can only review products you have received" (FR-REV-02).
- `409` if this customer already reviewed this product (FR-REV-03).

### GET `/api/reviews/product/{productId}`

```json
{
  "productId": 15,
  "averageRating": 4.3,
  "reviewCount": 27,
  "reviews": [
    {
      "reviewId": 88,
      "userId": 7,
      "userName": "Priya S.",
      "rating": 5,
      "comment": "Excellent build quality.",
      "createdAt": "2026-09-05T10:20:00"
    }
  ]
}
```

`userName` is stored on the review at submission time (DR-05), so rendering the list needs no call to the User Service.

---

## 10. Gateway routing table

Configured in `api-gateway/src/main/resources/application.yml`. Owner: **Dev A**.

| Path pattern                           | Target service       | Auth filter             |
| -------------------------------------- | -------------------- | ----------------------- |
| `/api/auth/login`                      | AUTH-SERVICE         | Off                     |
| `/api/auth/**`                         | AUTH-SERVICE         | On                      |
| `/api/users/register`                  | REGISTRATION-SERVICE | Off                     |
| `/api/users/**`                        | REGISTRATION-SERVICE | On                      |
| `/api/products/**` (GET)               | PRODUCT-SERVICE      | Off                     |
| `/api/products/**` (POST, PUT, DELETE) | PRODUCT-SERVICE      | On, ADMIN               |
| `/api/categories/**` (GET)             | PRODUCT-SERVICE      | Off                     |
| `/api/categories/**` (other)           | PRODUCT-SERVICE      | On, ADMIN               |
| `/api/cart/**`                         | CART-SERVICE         | On                      |
| `/api/wishlist/**`                     | WISHLIST-SERVICE     | On                      |
| `/api/orders/admin/**`                 | ORDER-SERVICE        | On, ADMIN               |
| `/api/orders/**`                       | ORDER-SERVICE        | On                      |
| `/api/payments/**`                     | PAYMENT-SERVICE      | On                      |
| `/api/reviews/product/**` (GET)        | REVIEW-SERVICE       | Off                     |
| `/api/reviews/**`                      | REVIEW-SERVICE       | On                      |
| `/api/**/internal/**`                  | —                    | **Blocked. Return 404** |

That last row matters. Internal endpoints must be unreachable from outside, or `X-User-Id` becomes forgeable and the whole auth model collapses. Add an explicit deny predicate and test it — hitting `localhost:8080/api/cart/internal/7` must return 404.

Route ordering matters in Spring Cloud Gateway: specific paths before wildcards. `/api/orders/admin/**` must be declared before `/api/orders/**`.

---

## 11. Ownership summary

| Developer | Services owned                                    |
| --------- | ------------------------------------------------- |
| Dev A     | Eureka, Gateway, Auth, Registration, `common-lib` |
| Dev B     | Product, Cart, Wishlist, Review                   |
| Dev C     | Order, Payment, React shell and routing           |

Cross-service Feign clients live in the **calling** service, written against DTOs in `common-lib`. Dev B writes the `ProductClient` used by Cart; Dev C writes the `CartClient`, `ProductClient`, and `PaymentClient` used by Order.

---

## 12. Shared DTOs in `common-lib`

These cross service boundaries and must be identical on both sides. Anyone changing one announces it first.

| DTO                                       | Produced by  | Consumed by           |
| ----------------------------------------- | ------------ | --------------------- |
| `ProductDto`                              | Product      | Cart, Wishlist, Order |
| `UserDto`                                 | Registration | Order, Review         |
| `AddressDto`                              | Registration | Order                 |
| `CartDto`, `CartItemDto`                  | Cart         | Order                 |
| `PaymentRequestDto`, `PaymentResponseDto` | Payment      | Order                 |
| `PurchaseCheckDto`                        | Order        | Review                |
| `ApiError`                                | All          | Front end             |

---

_End of document._
