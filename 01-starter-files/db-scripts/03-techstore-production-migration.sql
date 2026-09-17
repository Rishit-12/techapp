-- Apply to an existing development/demo database only after taking a backup.
-- For production, use your migration tool (Flyway/Liquibase) rather than running this manually.

USE `full-stack-ecommerce`;

ALTER TABLE product
  ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
  ADD COLUMN IF NOT EXISTS discount_price DECIMAL(13,2),
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE customer
  ADD COLUMN IF NOT EXISTS auth_subject VARCHAR(255);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS status VARCHAR(40) NOT NULL DEFAULT 'PLACED';

CREATE UNIQUE INDEX uk_customer_auth_subject ON customer(auth_subject);
CREATE UNIQUE INDEX uk_orders_payment_intent_id ON orders(payment_intent_id);
CREATE INDEX idx_product_category_active ON product(category_id, active);
CREATE INDEX idx_product_name ON product(name);
