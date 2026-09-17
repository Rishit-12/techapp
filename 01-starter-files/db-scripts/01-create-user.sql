-- Replace CHANGE_ME_STRONG_PASSWORD with a strong local/development password.
-- Never use this sample value in production.

CREATE USER 'ecommerceapp'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON `full-stack-ecommerce`.* TO 'ecommerceapp'@'localhost';

ALTER USER 'ecommerceapp'@'localhost'
  IDENTIFIED WITH caching_sha2_password BY 'CHANGE_ME_STRONG_PASSWORD';

FLUSH PRIVILEGES;
