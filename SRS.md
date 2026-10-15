# Software Requirements Specification

## ShopSphere — Microservices E-Commerce Platform

| Field            | Value                                                |
| ---------------- | ---------------------------------------------------- |
| Document version | 1.2                                                  |
| Date             | 09 September 2026                                    |
| Batch            | B09_Sept_JFS + React_PT_Shankar                      |
| Prepared for     | KR Shankar (Trainer), Aniket Choudhary (Coordinator) |
| Prepared by      | Shubham Kumar, Niesh Sharma, Anjali Sahu             |
| Status           | Baselined for implementation                         |

---

## Revision history

| Version | Date       | Author | Description                                                                                                                                                                                                               |
| ------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 01-09-2026 | Team   | Initial baseline                                                                                                                                                                                                          |
| 1.1     | 07-09-2026 | Team   | Java 21 confirmed; environment updated to Codespaces Dev Container with MySQL in Docker (§2.1, §2.3, C-14)                                                                                                                |
| 1.2     | 09-09-2026 | Dev A  | JWT validation fixed at the gateway as the single validation point (C-6); authorisation role stored as an enumerated column and the `roles` table removed (DR-09); Auth snapshots the user's email and first name (DR-10) |

---

## Table of contents

1. Introduction
2. Overall description
3. System architecture
4. Functional requirements
5. External interface requirements
6. Non-functional requirements
7. Data requirements
8. Constraints and assumptions
9. Out of scope
10. Acceptance criteria
11. Appendices

---

## 1. Introduction

### 1.1 Purpose

This document specifies the requirements for **ShopSphere**, a microservices-based e-commerce platform built as the case study deliverable for the Java Full Stack training programme.

It defines what the system must do, what constraints it operates under, and what constitutes completion. It is the reference against which the implementation is evaluated and the source from which the design diagrams, API contracts, and test cases are derived.

The intended readers are the development team (three developers), the trainer conducting the one-on-one evaluation, and the programme coordinator.

### 1.2 Scope

ShopSphere is a web-based online retail platform. It allows customers to browse a product catalogue, search and filter products, maintain a cart and a wishlist, place orders, make payments, track order status, and leave product reviews. Administrators manage the catalogue and order fulfilment.

The system is decomposed into ten independently deployable Spring Boot services, registered with a service registry and exposed through a single API gateway. The user interface is a ReactJS single-page application. Persistence is provided by MySQL, with each service owning a private schema.

The system is built for demonstration and evaluation. It is not intended for commercial deployment, and payment processing is simulated rather than connected to a live payment provider. The architecture is nevertheless designed so that a production deployment would require configuration changes rather than structural rework.

### 1.3 Definitions and abbreviations

| Term         | Meaning                                                               |
| ------------ | --------------------------------------------------------------------- |
| API Gateway  | Single entry point that routes external requests to internal services |
| AOP          | Aspect-Oriented Programming                                           |
| DTO          | Data Transfer Object — the shape of data crossing a service boundary  |
| Eureka       | Netflix service registry used for service discovery                   |
| Feign        | Declarative HTTP client used for service-to-service calls             |
| JPA          | Java Persistence API                                                  |
| JWT          | JSON Web Token, used for stateless authentication                     |
| Microservice | An independently deployable service owning its own data               |
| SLF4J        | Simple Logging Facade for Java                                        |
| Actor        | A role that interacts with the system (Guest, Customer, Admin)        |

### 1.4 References

- Case study requirements issued by KR Shankar, 01-09-2026 (Teams chat, 10:49 / 10:54 / 10:57)
- Tracking sheet `B09_Sept_Shankar_CaseStudy.xlsx`
- Spring Boot 3.3.x and Spring Cloud 2023.0.x reference documentation
- IEEE 830 SRS structure (adapted, not followed exhaustively)

### 1.5 Document overview

Section 2 describes the system in context. Section 3 defines the service decomposition. Section 4 lists functional requirements by service, each with a unique identifier for traceability into test cases. Sections 5 to 8 cover interfaces, quality attributes, data, and constraints. Section 9 states explicitly what is not being built. Section 10 defines done.

---

## 2. Overall description

### 2.1 Product perspective

ShopSphere is a self-contained system with no dependency on external commercial services. It replaces a hypothetical monolithic retail application with a distributed architecture in which each business capability is owned by a separate service with a private database.

The system runs entirely within each developer's environment. All services, the registry, the gateway, the database, and the front-end run locally. Development takes place in a GitHub Codespace provisioned by a Dev Container. The application services run natively through the Maven Wrapper; MySQL runs as a Docker container backed by a named persistent volume. No application service is containerised.

### 2.2 User classes and characteristics

**Guest** — an unauthenticated visitor. Can browse the catalogue, search, filter, view product details, and read reviews. Cannot transact. Must register to proceed further.

**Customer** — a registered, authenticated user. Holds a JWT for the duration of a session. Manages a profile and delivery addresses, maintains a cart and a wishlist, places and pays for orders, tracks orders, views order history, and submits reviews on products they have purchased.

**Administrator** — a privileged user. Manages the product catalogue and categories, adjusts stock, views all orders, and advances order fulfilment status. Administrators do not shop through the system.

Users are assumed to be comfortable with standard e-commerce web interfaces. No training is required.

### 2.3 Operating environment

| Component               | Environment                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------- |
| Server-side runtime     | Java 21, Spring Boot 3.3.x                                                             |
| Database                | MySQL 8.4, Docker container with a named persistent volume                             |
| Client                  | Modern desktop browser (Chrome, Edge, Firefox — current versions)                      |
| Front-end runtime       | Node.js 18+, Vite development server                                                   |
| Build                   | Apache Maven 3.9+ via the Maven Wrapper, multi-module                                  |
| Source control          | Git, single GitHub repository                                                          |
| Development environment | GitHub Codespaces with a Dev Container providing JDK 21, Docker CLI and Docker Compose |

### 2.4 Design and implementation constraints

The following are mandated by the case study requirements and are not open to team discretion:

- **C-1** — The back end must be implemented as Spring Boot microservices.
- **C-2** — The front end must be implemented in ReactJS.
- **C-3** — The database must be MySQL, accessed via Spring Data JPA.
- **C-4** — All services must register with a Eureka server.
- **C-5** — All services must be reachable only through the API gateway port. No service port may be called directly by the client.
- **C-6** — JWT filter implemented at the gateway as the single validation point.
- **C-7** — Logging must be implemented using AOP aspects with SLF4J, and a log file must be physically written to disk during execution.
- **C-8** — Unit tests must exist for all services using JUnit and Mockito, and must pass.
- **C-9** — SonarQube-reported code coverage must exceed 80%.
- **C-10** — Coding standards must be followed: naming conventions, indentation, and comments.
- **C-11** — All input fields must be validated.
- **C-12** — Exceptions must produce meaningful messages propagated to the end user.
- **C-13** — The user interface must be visually uniform across pages, with routing to all pages.
- **C-14** — Application services shall run natively through the Maven Wrapper and shall not be containerised. MySQL shall run as a Docker container with a named persistent volume, started through the project's `docker-compose.yml`.
- **C-15** — Total development duration is 10 working days: 5 for the back end, 5 for the front end including integration.

### 2.5 Assumptions and dependencies

- A single MySQL instance hosts all eight schemas. Each schema is treated as private to its owning service.
- Developer workstations can run the required services concurrently. Where memory is limited, only the subset of services under active development need be running.
- Payment authorisation is simulated. No PCI-DSS obligations arise.
- Email and SMS notifications are not implemented; order status is visible only in the application.
- Product images are referenced by URL. No file upload or image hosting is built.
- Concurrency is low. The system is not required to handle simultaneous multi-user load beyond the demonstration.

---

## 3. System architecture

### 3.1 Service decomposition

The system comprises two infrastructure services and eight business services.

| #   | Service              | Type           | Responsibility                                                |
| --- | -------------------- | -------------- | ------------------------------------------------------------- |
| 1   | Eureka Server        | Infrastructure | Service registry; holds the location of every running service |
| 2   | API Gateway          | Infrastructure | Single public entry point; routing, JWT validation, CORS      |
| 3   | Registration Service | Business       | User accounts, profiles, delivery addresses                   |
| 4   | Auth Service         | Business       | Credential verification, JWT issue and validation, roles      |
| 5   | Product Service      | Business       | Catalogue, categories, search, filtering, stock levels        |
| 6   | Cart Service         | Business       | Per-user shopping cart and line items                         |
| 7   | Wishlist Service     | Business       | Per-user saved products                                       |
| 8   | Order Service        | Business       | Order creation, line items, status lifecycle, history         |
| 9   | Payment Service      | Business       | Simulated payment authorisation and transaction records       |
| 10  | Review Service       | Business       | Product ratings and written reviews                           |

### 3.2 Communication

External clients communicate with the gateway over HTTP/JSON. The gateway resolves the target service through Eureka and forwards the request.

Service-to-service communication uses declarative Feign clients over HTTP, resolved through Eureka by logical service name. No service holds a hardcoded address for another.

Inter-service dependencies:

| Caller           | Callee          | Purpose                                   |
| ---------------- | --------------- | ----------------------------------------- |
| Gateway          | Auth Service    | Token validation                          |
| Cart Service     | Product Service | Price and stock verification              |
| Wishlist Service | Product Service | Product detail enrichment                 |
| Order Service    | Cart Service    | Retrieve cart contents at checkout        |
| Order Service    | Product Service | Stock decrement on order confirmation     |
| Order Service    | Payment Service | Initiate payment for an order             |
| Review Service   | Order Service   | Verify the reviewer purchased the product |

### 3.3 Data ownership

Each business service owns exactly one MySQL schema and is the only component permitted to read or write it. Foreign key constraints exist within a schema. No foreign key crosses a schema boundary. Where a service must reference an entity owned by another, it stores the identifier as a plain numeric column and retrieves related data through the owning service's API.

Where historical accuracy is required — order line items, review author names — the referenced values are copied at the time of the transaction and stored as a snapshot. This is deliberate denormalisation, not redundancy.

---

## 4. Functional requirements

Each requirement carries an identifier of the form `FR-<service>-<number>` for traceability into the API contract, test cases, and the acceptance checklist.

### 4.1 Registration Service (FR-REG)

| ID        | Requirement                                                                                                         | Priority |
| --------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-REG-01 | The system shall allow a guest to register with first name, last name, email, password, and phone number.           | High     |
| FR-REG-02 | The system shall reject registration if the email is already associated with an account, returning a clear message. | High     |
| FR-REG-03 | The system shall validate email format, phone number format, and password strength before accepting a registration. | High     |
| FR-REG-04 | The system shall store passwords using BCrypt hashing. Plain-text passwords shall never be persisted or logged.     | High     |
| FR-REG-05 | The system shall allow an authenticated customer to view and update their profile.                                  | High     |
| FR-REG-06 | The system shall allow a customer to add, edit, and delete multiple delivery addresses.                             | High     |
| FR-REG-07 | The system shall allow a customer to designate one address as the default.                                          | Medium   |
| FR-REG-08 | The system shall prevent deletion of an address that is the customer's only address.                                | Low      |

### 4.2 Auth Service (FR-AUTH)

| ID         | Requirement                                                                                                                       | Priority |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-AUTH-01 | The system shall authenticate a user by email and password and issue a signed JWT on success.                                     | High     |
| FR-AUTH-02 | The JWT shall carry the user identifier, email, and role, and shall expire after a configured interval.                           | High     |
| FR-AUTH-03 | The system shall return a clear authentication failure message without revealing whether the email or the password was incorrect. | High     |
| FR-AUTH-04 | The system shall expose an endpoint that validates a supplied token and returns its claims.                                       | High     |
| FR-AUTH-05 | The system shall assign the CUSTOMER role by default and support an ADMIN role.                                                   | High     |
| FR-AUTH-06 | The system shall allow an authenticated user to change their password, requiring the current password.                            | Medium   |
| FR-AUTH-07 | The system shall allow logout, discarding the token client-side.                                                                  | Medium   |

### 4.3 API Gateway (FR-GW)

| ID       | Requirement                                                                                                                 | Priority |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-GW-01 | The gateway shall be the sole entry point for all client requests.                                                          | High     |
| FR-GW-02 | The gateway shall route requests to services resolved through Eureka by logical service name.                               | High     |
| FR-GW-03 | The gateway shall apply a JWT filter to all protected routes, rejecting absent, malformed, or expired tokens with HTTP 401. | High     |
| FR-GW-04 | The gateway shall permit unauthenticated access to registration, login, product browsing, and review reading.               | High     |
| FR-GW-05 | The gateway shall forward the authenticated user identifier to downstream services as a request header.                     | High     |
| FR-GW-06 | The gateway shall permit cross-origin requests from the React development server origin.                                    | High     |

### 4.4 Product Service (FR-PRD)

| ID        | Requirement                                                                                                             | Priority |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-PRD-01 | The system shall allow any user to browse products with pagination.                                                     | High     |
| FR-PRD-02 | The system shall allow any user to view full details of a single product.                                               | High     |
| FR-PRD-03 | The system shall allow any user to search products by name or description keyword.                                      | High     |
| FR-PRD-04 | The system shall allow filtering by category, price range, and availability, applied in combination.                    | High     |
| FR-PRD-05 | The system shall allow sorting by price ascending, price descending, and newest first.                                  | Medium   |
| FR-PRD-06 | The system shall organise products into categories, and allow browsing by category.                                     | High     |
| FR-PRD-07 | The system shall allow an administrator to create, update, and delete products.                                         | High     |
| FR-PRD-08 | The system shall allow an administrator to create and manage categories.                                                | High     |
| FR-PRD-09 | The system shall maintain a stock quantity per product and expose it.                                                   | High     |
| FR-PRD-10 | The system shall provide an internal endpoint to decrement stock, rejecting the operation if insufficient stock exists. | High     |
| FR-PRD-11 | The system shall return a clear message when a requested product does not exist.                                        | High     |

### 4.5 Cart Service (FR-CART)

| ID         | Requirement                                                                                                                    | Priority |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| FR-CART-01 | The system shall maintain one active cart per authenticated customer.                                                          | High     |
| FR-CART-02 | The system shall allow a customer to add a product to their cart with a specified quantity.                                    | High     |
| FR-CART-03 | The system shall verify product existence and stock availability with the Product Service before adding an item.               | High     |
| FR-CART-04 | The system shall increment the quantity rather than create a duplicate line when a product already in the cart is added again. | High     |
| FR-CART-05 | The system shall allow a customer to change the quantity of a cart item.                                                       | High     |
| FR-CART-06 | The system shall allow a customer to remove an item from the cart.                                                             | High     |
| FR-CART-07 | The system shall allow a customer to empty their cart.                                                                         | Medium   |
| FR-CART-08 | The system shall calculate and return the cart subtotal, item count, and per-line totals.                                      | High     |
| FR-CART-09 | The system shall reject a quantity that is zero, negative, or exceeds available stock, with a clear message.                   | High     |

### 4.6 Wishlist Service (FR-WISH)

| ID         | Requirement                                                                            | Priority |
| ---------- | -------------------------------------------------------------------------------------- | -------- |
| FR-WISH-01 | The system shall allow a customer to add a product to their wishlist.                  | High     |
| FR-WISH-02 | The system shall prevent the same product appearing twice in one wishlist.             | High     |
| FR-WISH-03 | The system shall allow a customer to view their wishlist with current product details. | High     |
| FR-WISH-04 | The system shall allow a customer to remove an item from their wishlist.               | High     |
| FR-WISH-05 | The system shall allow a customer to move a wishlist item into their cart.             | Medium   |

### 4.7 Order Service (FR-ORD)

| ID        | Requirement                                                                                                      | Priority |
| --------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| FR-ORD-01 | The system shall create an order from the customer's cart contents at checkout.                                  | High     |
| FR-ORD-02 | The system shall require a delivery address to be selected before an order is created.                           | High     |
| FR-ORD-03 | The system shall copy the product name and unit price into each order line at the time of order creation.        | High     |
| FR-ORD-04 | The system shall calculate and store the order total.                                                            | High     |
| FR-ORD-05 | The system shall initiate payment through the Payment Service and record the outcome.                            | High     |
| FR-ORD-06 | The system shall decrement product stock only after payment succeeds.                                            | High     |
| FR-ORD-07 | The system shall empty the customer's cart after an order is successfully placed.                                | High     |
| FR-ORD-08 | The system shall maintain order status through the lifecycle: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED. | High     |
| FR-ORD-09 | The system shall allow a customer to view their order history in reverse chronological order.                    | High     |
| FR-ORD-10 | The system shall allow a customer to view the current status and details of a specific order.                    | High     |
| FR-ORD-11 | The system shall allow a customer to cancel an order that has not yet been shipped.                              | Medium   |
| FR-ORD-12 | The system shall allow an administrator to view all orders and advance an order's status.                        | High     |
| FR-ORD-13 | The system shall reject checkout of an empty cart with a clear message.                                          | High     |

### 4.8 Payment Service (FR-PAY)

| ID        | Requirement                                                                                             | Priority |
| --------- | ------------------------------------------------------------------------------------------------------- | -------- |
| FR-PAY-01 | The system shall accept a payment request containing an order identifier, amount, and payment method.   | High     |
| FR-PAY-02 | The system shall support CARD, UPI, NET_BANKING, and CASH_ON_DELIVERY as payment methods.               | High     |
| FR-PAY-03 | The system shall simulate authorisation and return SUCCESS or FAILURE with a transaction reference.     | High     |
| FR-PAY-04 | The system shall persist every payment attempt, including failures, with a timestamp.                   | High     |
| FR-PAY-05 | The system shall reject a second payment for an order already paid, returning the existing transaction. | High     |
| FR-PAY-06 | The system shall validate that the payment amount matches the order total.                              | High     |
| FR-PAY-07 | The system shall allow a customer to view the payment record for their order.                           | Medium   |

### 4.9 Review Service (FR-REV)

| ID        | Requirement                                                                                                    | Priority |
| --------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| FR-REV-01 | The system shall allow a customer to submit a rating from 1 to 5 and an optional written review for a product. | High     |
| FR-REV-02 | The system shall permit a review only if the customer has a delivered order containing that product.           | High     |
| FR-REV-03 | The system shall permit only one review per customer per product.                                              | High     |
| FR-REV-04 | The system shall allow any user to read all reviews for a product.                                             | High     |
| FR-REV-05 | The system shall calculate and expose the average rating and review count per product.                         | High     |
| FR-REV-06 | The system shall allow a customer to edit or delete their own review.                                          | Medium   |

### 4.10 Cross-cutting (FR-SYS)

| ID        | Requirement                                                                                                        | Priority |
| --------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| FR-SYS-01 | Every service shall register itself with the Eureka server on startup.                                             | High     |
| FR-SYS-02 | Every service shall handle exceptions globally and return a consistent error response structure.                   | High     |
| FR-SYS-03 | Every service shall log method entry, exit, and exceptions via an AOP aspect using SLF4J.                          | High     |
| FR-SYS-04 | Every service shall write its logs to a file on disk in addition to the console.                                   | High     |
| FR-SYS-05 | Every service shall validate all incoming request fields and return HTTP 400 with field-level messages on failure. | High     |
| FR-SYS-06 | Every service shall expose a health endpoint.                                                                      | Medium   |

---

## 5. External interface requirements

### 5.1 User interface

The front end is a ReactJS single-page application using React Router for navigation.

**Required routes:**

| Route             | Access   | Purpose                                    |
| ----------------- | -------- | ------------------------------------------ |
| `/`               | Public   | Home, featured products                    |
| `/products`       | Public   | Catalogue with search, filters, pagination |
| `/products/:id`   | Public   | Product detail and reviews                 |
| `/login`          | Public   | Authentication                             |
| `/register`       | Public   | Account creation                           |
| `/cart`           | Customer | Cart contents and totals                   |
| `/wishlist`       | Customer | Saved products                             |
| `/checkout`       | Customer | Address selection and payment              |
| `/orders`         | Customer | Order history                              |
| `/orders/:id`     | Customer | Order detail and tracking                  |
| `/profile`        | Customer | Profile and address management             |
| `/admin/products` | Admin    | Catalogue management                       |
| `/admin/orders`   | Admin    | Order management                           |
| `*`               | Public   | Not-found page                             |

**Interface requirements:**

- **UI-01** — A shared header, navigation, and footer shall appear on every page.
- **UI-02** — Typography, spacing, colour, button styles, and form controls shall be consistent across all pages, drawn from a single shared style definition.
- **UI-03** — Protected routes shall redirect unauthenticated users to the login page.
- **UI-04** — Every asynchronous operation shall display a loading state.
- **UI-05** — Every error returned by the back end shall be displayed to the user in readable form, never as a raw stack trace or status code alone.
- **UI-06** — Form validation shall occur on the client before submission, and server-side validation messages shall be displayed against the relevant field.
- **UI-07** — The JWT shall be attached to outgoing requests automatically by a shared HTTP client interceptor.
- **UI-08** — Expiry or rejection of the token shall clear the session and redirect to login.

### 5.2 API interface

- All endpoints accept and return `application/json`.
- All client traffic passes through the gateway on port 8080. No client code shall reference any other port.
- Endpoints are versioned under `/api/`.
- Standard status codes apply: 200 success, 201 created, 400 validation failure, 401 unauthenticated, 403 unauthorised, 404 not found, 409 conflict, 500 server error.
- Error responses share a single structure containing timestamp, status, message, and where applicable a map of field errors.

The complete endpoint list is maintained separately in `docs/api-contract.md`.

### 5.3 Software interfaces

| Interface     | Detail                                 |
| ------------- | -------------------------------------- |
| MySQL         | JDBC via Spring Data JPA and Hibernate |
| Eureka        | HTTP registration and heartbeat        |
| Inter-service | HTTP/JSON via Spring Cloud OpenFeign   |

No third-party commercial APIs are integrated.

---

## 6. Non-functional requirements

### 6.1 Security

- **NFR-SEC-01** — Passwords shall be hashed with BCrypt. Reversible encryption and plain storage are prohibited.
- **NFR-SEC-02** — Authentication shall be stateless using JWT. No server-side session shall be maintained.
- **NFR-SEC-03** — The JWT signing secret shall be supplied by configuration, never hardcoded in source.
- **NFR-SEC-04** — Role-based authorisation shall protect administrative endpoints.
- **NFR-SEC-05** — A customer shall be able to access only their own cart, wishlist, orders, and profile.
- **NFR-SEC-06** — Credentials, tokens, and personal data shall never appear in log output.
- **NFR-SEC-07** — All input shall be validated server-side regardless of client-side validation.

### 6.2 Performance

- **NFR-PERF-01** — A single-service read operation shall respond within 2 seconds under demonstration conditions.
- **NFR-PERF-02** — Product listings shall be paginated, with a default page size of 12 and a maximum of 100.
- **NFR-PERF-03** — Checkout, which spans four services, shall complete within 5 seconds.

### 6.3 Reliability

- **NFR-REL-01** — Failure of one service shall not crash the gateway or other services.
- **NFR-REL-02** — When a downstream service is unavailable, the caller shall return a meaningful message rather than an unhandled exception.
- **NFR-REL-03** — Payment failure shall leave the order in an unconfirmed state with stock unmodified.

### 6.4 Maintainability

- **NFR-MAIN-01** — Each service shall follow a controller / service / repository / entity layering. Business logic shall not reside in controllers.
- **NFR-MAIN-02** — Java naming conventions shall be followed: PascalCase classes, camelCase methods and fields, UPPER_SNAKE_CASE constants.
- **NFR-MAIN-03** — Consistent indentation shall be applied throughout. Formatting shall be uniform across the team.
- **NFR-MAIN-04** — Every class and every non-trivial public method shall carry a Javadoc comment stating its purpose.
- **NFR-MAIN-05** — Shared exceptions, DTOs, the logging aspect, and the global exception handler shall reside in a common module rather than being duplicated.
- **NFR-MAIN-06** — Configuration values shall be externalised with environment-variable placeholders and local defaults.

### 6.5 Testability

- **NFR-TEST-01** — Unit tests shall exist for all service-layer classes in every service.
- **NFR-TEST-02** — Tests shall use JUnit 5 and Mockito. Dependencies on other services shall be mocked, not invoked.
- **NFR-TEST-03** — Controller endpoints shall be tested using MockMvc, covering success and validation-failure paths.
- **NFR-TEST-04** — Repository queries shall be tested against an in-memory database.
- **NFR-TEST-05** — Line coverage reported by SonarQube shall exceed 80%.
- **NFR-TEST-06** — All tests shall pass. No test shall be disabled or ignored to achieve a green build.

### 6.6 Observability

- **NFR-OBS-01** — Logging shall be implemented as an AOP aspect, not as scattered logger calls inside business methods.
- **NFR-OBS-02** — SLF4J with Logback shall be used, configured with a rolling file appender.
- **NFR-OBS-03** — Each service shall write to a distinct named log file under a `logs` directory.
- **NFR-OBS-04** — Log entries shall include timestamp, level, logger name, and message.
- **NFR-OBS-05** — Exceptions shall be logged with their stack trace at ERROR level.

### 6.7 Portability

- **NFR-PORT-01** — The system shall run on Windows, Linux, and macOS without code modification.
- **NFR-PORT-02** — Each service shall build to a self-contained executable jar.
- **NFR-PORT-03** — Environment-specific configuration shall be selectable through Spring profiles.

---

## 7. Data requirements

### 7.1 Schema ownership

| Service      | Schema                | Principal tables         |
| ------------ | --------------------- | ------------------------ |
| Registration | `shopsphere_user`     | `users`, `addresses`     |
| Auth         | `shopsphere_auth`     | `credentials`            |
| Product      | `shopsphere_product`  | `products`, `categories` |
| Cart         | `shopsphere_cart`     | `carts`, `cart_items`    |
| Wishlist     | `shopsphere_wishlist` | `wishlist_items`         |
| Order        | `shopsphere_order`    | `orders`, `order_items`  |
| Payment      | `shopsphere_payment`  | `payments`               |
| Review       | `shopsphere_review`   | `reviews`                |

### 7.2 Data rules

- **DR-01** — Each schema shall be accessed exclusively by its owning service.
- **DR-02** — Foreign key constraints shall exist only within a schema. No constraint shall reference a table in another schema.
- **DR-03** — Cross-service references shall be stored as plain identifier columns.
- **DR-04** — Order line items shall store the product name and unit price as they were at the time of purchase.
- **DR-05** — Reviews shall store the reviewer's display name alongside the user identifier.
- **DR-06** — Every table shall carry a surrogate primary key generated by the database.
- **DR-07** — Records representing transactions shall carry creation timestamps.
- **DR-08** — Monetary values shall use a fixed-precision decimal type, never floating point.
- **DR-09** — The authorisation role shall be stored as an enumerated column on `credentials`. FR-AUTH-05 fixes the set at exactly CUSTOMER and ADMIN and no role-management screen is in scope, so a separate `roles` table would introduce a seed-data dependency without adding flexibility. Adding a third role requires an `ALTER TABLE`.
- **DR-10** — The Auth Service shall hold its own copies of the user's email address and first name, captured at signup. Auth never calls the Registration Service, so the login response is served without a cross-service read. Same principle as DR-04.

### 7.3 Retention

All data persists for the duration of the evaluation. No archival, purging, or backup policy is required. Seed data sufficient for demonstration shall be maintained under `db/seed`.

The full entity-relationship model is maintained separately as the ER Diagram deliverable.

---

## 8. Constraints and assumptions summary

Design constraints are enumerated in section 2.4 as C-1 through C-15. Assumptions are enumerated in section 2.5.

The most significant risk arising from these constraints is the concentration of quality obligations — 80% coverage, complete test suites, AOP logging, and full validation — within a 10-day window shared with feature development. The mitigation is to treat tests and logging as part of each service's definition of done rather than as a phase at the end.

---

## 9. Out of scope

The following are explicitly excluded. They shall not be implemented, and their absence is not a defect.

- Integration with any real payment gateway
- Email, SMS, or push notification of any kind
- Password reset by email link
- Coupon codes, discount rules, promotional pricing
- Refunds, returns, and exchange handling
- Multi-vendor or seller accounts
- Product image upload and hosting
- Real-time delivery tracking or courier integration
- Recommendation engines and personalisation
- Multi-currency and internationalisation
- Guest checkout without registration
- Inventory reservation with timeout
- Analytics dashboards and reporting
- Mobile applications
- Social login
- Live chat or customer support ticketing

---

## 10. Acceptance criteria

The system is complete when all of the following hold.

**Architecture**

- [ ] Eureka server runs and its dashboard shows all ten services registered
- [ ] All client traffic passes through the gateway port; no service port is referenced by the front end
- [ ] Registration and Auth services function independently
- [ ] JWT filter rejects absent, malformed, and expired tokens
- [ ] All eight business services are implemented and reachable

**Back-end quality**

- [ ] Global exception handling returns consistent, readable messages
- [ ] Every input field is validated with field-level error reporting
- [ ] AOP aspect with SLF4J is active and a log file exists on disk after execution
- [ ] Spring Data JPA with MySQL persists all data across eight schemas
- [ ] JUnit and Mockito tests exist for every service and all pass
- [ ] SonarQube coverage exceeds 80%

**Front-end**

- [ ] All routes listed in section 5.1 are implemented and reachable
- [ ] Header, navigation, footer, and styling are uniform on every page
- [ ] Every page is integrated with the back end through the gateway
- [ ] Authentication flow attaches, refreshes, and clears the JWT correctly
- [ ] Loading and error states are present on every asynchronous operation

**Deliverables**

- [ ] Use Case Diagram
- [ ] Class Diagram
- [ ] ER Diagram
- [ ] This SRS
- [ ] Code committed to Git with a working Maven build
- [ ] Every team member holds a complete copy of the case study
- [ ] Every team member can demonstrate and answer questions on any module

---

## 11. Appendices

### Appendix A — Port allocation

| Component            | Port |
| -------------------- | ---- |
| Eureka Server        | 8761 |
| API Gateway          | 8080 |
| Registration Service | 8081 |
| Auth Service         | 8082 |
| Product Service      | 8083 |
| Cart Service         | 8084 |
| Wishlist Service     | 8085 |
| Order Service        | 8086 |
| Payment Service      | 8087 |
| Review Service       | 8088 |
| MySQL                | 3306 |
| React (Vite)         | 5173 |

### Appendix B — Technology stack

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| Language       | Java 21                                            |
| Framework      | Spring Boot 3.3.x                                  |
| Cloud          | Spring Cloud 2023.0.x — Eureka, Gateway, OpenFeign |
| Security       | Spring Security, JWT                               |
| Persistence    | Spring Data JPA, Hibernate, MySQL 8                |
| Validation     | Jakarta Bean Validation                            |
| Logging        | SLF4J, Logback, Spring AOP                         |
| Testing        | JUnit 5, Mockito, MockMvc, H2                      |
| Coverage       | JaCoCo, SonarQube                                  |
| Build          | Apache Maven, multi-module                         |
| Front-end      | ReactJS, React Router, Axios, Vite                 |
| Source control | Git, GitHub                                        |

### Appendix C — Requirement identifier prefixes

| Prefix  | Area                        |
| ------- | --------------------------- |
| FR-REG  | Registration Service        |
| FR-AUTH | Auth Service                |
| FR-GW   | API Gateway                 |
| FR-PRD  | Product Service             |
| FR-CART | Cart Service                |
| FR-WISH | Wishlist Service            |
| FR-ORD  | Order Service               |
| FR-PAY  | Payment Service             |
| FR-REV  | Review Service              |
| FR-SYS  | Cross-cutting               |
| UI      | User interface              |
| NFR-\*  | Non-functional, by category |
| DR      | Data rules                  |
| C       | Design constraints          |

### Appendix D — Traceability to evaluation parameters

| #   | Evaluation parameter                   | Where addressed                                     |
| --- | -------------------------------------- | --------------------------------------------------- |
| 1   | Requirement Understanding              | Sections 1–4 of this document                       |
| 2   | Design Diagrams                        | Separate deliverables; data model in section 7      |
| 3   | Completeness and working demonstration | Section 10 acceptance criteria                      |
| 4   | Ability to apply concepts              | NFR-MAIN-01 layering enables rapid extension        |
| 5   | Coding standards                       | NFR-MAIN-02 through NFR-MAIN-04                     |
| 6   | AOP loggers with SLF4J                 | NFR-OBS-01 through NFR-OBS-05, FR-SYS-03, FR-SYS-04 |
| 7   | JUnit and Mockito testing              | NFR-TEST-01 through NFR-TEST-06                     |
| 8   | Exception handling and validation      | FR-SYS-02, FR-SYS-05, NFR-SEC-07                    |
| 9   | DevOps — Git, Maven, SonarQube >80%    | NFR-TEST-05, section 10                             |
| 10  | Q&A viva voce                          | Section 10, final deliverable item                  |

---

_End of document._
