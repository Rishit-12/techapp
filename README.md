# TechStore — Full-Stack E-Commerce Application

TechStore is a production-style e-commerce learning project built with Angular and Spring Boot. It has been refactored around a coherent technology-store domain, a secure checkout flow, Auth0 authentication, Stripe payments, MySQL persistence and a responsive storefront.

## Technology stack

- Angular 17
- TypeScript
- Bootstrap 5 / Font Awesome
- Auth0 Angular SDK
- Spring Boot 4.1
- Java 17+
- Spring Data JPA / Spring Data REST
- Spring Security OAuth2 Resource Server
- MySQL
- Stripe Payment Intents
- Maven

## Main features

### Day 2 hardening
- Server-side effective-price calculation using the current database catalog
- Stripe PaymentIntent idempotency keys to reduce duplicate payment attempts
- Payment metadata binds a PaymentIntent to the authenticated customer
- Payment amount/currency/status verification before order persistence
- Automatic refund attempt if a post-payment order persistence/stock failure occurs
- Optimistic locking on product inventory
- Authenticated order history without browser-supplied customer identifiers
- Structured 401/403/409/400/502/500 API error responses
- Stateless Spring Security configuration with basic security headers
- Secure local development script separated from committed TLS private keys

- Responsive technology storefront
- Product categories and search
- Server-side pagination and sorting
- Product details and stock visibility
- Persistent shopping cart
- Auth0 login/logout
- Authenticated checkout
- Server-authoritative Stripe PaymentIntent creation
- Server-side payment verification before order creation
- Stock validation and decrement
- Idempotent order creation for a payment intent
- Customer order history scoped to the authenticated Auth0 subject
- Centralized API error responses
- Environment-based configuration
- Health endpoint
- Production-oriented database indexes and constraints

## Project structure

```text
01-starter-files/
  db-scripts/

02-backend/
  spring-boot-ecommerce/
    src/main/java/com/luv2code/ecommerce/
      config/
      controller/
      dao/
      dto/
      entity/
      service/

03-frontend/
  angular-ecommerce/
    src/app/
      common/
      components/
      config/
      services/
      validators/
```

## Local setup

### 1. Database

Create the MySQL database using:

`01-starter-files/db-scripts/02-create-products.sql`

This is a **fresh demo database script** and intentionally drops/recreates the demo schema. Never run it against a database containing real customer/order data.

For an existing development database, review:

`01-starter-files/db-scripts/03-techstore-production-migration.sql`

For real production environments, use a migration system such as Flyway or Liquibase instead of manually applying schema changes.

### 2. Backend

Requirements:

- Java 17 or newer
- MySQL
- Maven Wrapper

Set these environment variables as needed:

```text
DB_URL=jdbc:mysql://localhost:3306/full-stack-ecommerce
DB_USERNAME=ecommerceapp
DB_PASSWORD=your-password

AUTH0_ISSUER=https://your-tenant.auth0.com/
AUTH0_AUDIENCE=your-api-audience

STRIPE_SECRET_KEY=sk_test_or_live_key
ALLOWED_ORIGINS=http://localhost:4200

SERVER_PORT=8080
SSL_ENABLED=false
```

Run:

```bash
cd 02-backend/spring-boot-ecommerce
./mvnw spring-boot:run
```

Windows:

```powershell
cd 02-backend\spring-boot-ecommerce
.\mvnw.cmd spring-boot:run
```

Health check:

```text
http://localhost:8080/actuator/health
```

### 3. Frontend

Requirements:

- Node.js
- npm

Configure:

`03-frontend/angular-ecommerce/src/environments/environment.development.ts`

Set the Auth0 domain/client ID/audience and Stripe publishable key for your development accounts.

Install and run:

```bash
cd 03-frontend/angular-ecommerce
npm ci
npm start

# Optional local HTTPS (requires your own locally generated cert/key):
npm run start:secure
```

Open:

```text
http://localhost:4200
```

### Auth0

Configure your Auth0 application with:

- Allowed Callback URLs: `http://localhost:4200`
- Allowed Logout URLs: `http://localhost:4200`
- Allowed Web Origins: `http://localhost:4200`

The Auth0 API audience must exactly match `AUTH0_AUDIENCE` in the backend and `auth0Audience` in the frontend.

### Stripe

The backend creates the PaymentIntent from product IDs and quantities. The client does **not** determine the authoritative order amount.

The frontend confirms the PaymentIntent with Stripe.js. The backend retrieves the PaymentIntent and verifies:

- payment status
- currency
- amount
- cart contents
- product availability

Only then is the order persisted.

Never put the Stripe secret key in Angular. The publishable key may be used by the browser.

## Production configuration

For production:

- Use `spring.jpa.hibernate.ddl-auto=validate`
- Use a managed MySQL database
- Use HTTPS at the edge/load balancer
- Set `SSL_ENABLED` only when the application itself terminates TLS
- Provide secrets through the deployment platform's secret manager
- Set `ALLOWED_ORIGINS` to the exact production frontend origin
- Use a production Auth0 tenant/API audience
- Use a live Stripe secret only on the backend
- Use a live Stripe publishable key in the frontend build
- Enable database backups and monitoring
- Use Flyway/Liquibase for schema migrations

Do not commit:

- passwords
- Stripe secret keys
- OAuth client secrets
- private keys
- PKCS12/JKS keystores
- production database credentials

## Security notes

The API requires authentication for checkout and orders. Customer/order repository writes are not exposed through Spring Data REST.

Order history is retrieved through `/api/orders/me` and is scoped to the Auth0 `sub` claim rather than trusting an email address supplied by the browser.

The checkout server recalculates prices from the database and ignores client-provided product prices when calculating the payment amount.

## Testing

Run frontend unit tests:

```bash
npm test
```

Build the frontend:

```bash
npm run build
```

Build the backend:

```bash
./mvnw -DskipTests package
```

Windows:

```powershell
.\mvnw.cmd -DskipTests package
```

A clean Angular/Maven build could not be completed in the execution environment used for this refactor because external npm/Maven package downloads were unavailable. Static source/configuration checks were performed. **Run the build commands locally before deployment and fix any environment-specific dependency issues first.**

## Known limitations

- The admin management UI is not included in this 2-day pass because the existing Auth0 tenant does not expose a confirmed admin-role/permission contract. Adding an admin UI without a verified authorization model would be unsafe.
- Wishlist and customer reviews are not included in this pass.
- Advanced catalog filters such as brand and price range require additional query endpoints.
- Stripe webhook processing should be added before treating the application as a real-money production system. A webhook should be the final source of truth for asynchronous payment events.
- Production should use Flyway/Liquibase and `spring.jpa.hibernate.ddl-auto=validate` rather than relying on Hibernate schema updates.

## License

Learning/demo project.
