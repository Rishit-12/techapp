-- TechStore demo catalog
-- Fresh development/demo database setup. Do not run against a production database with customer data.

DROP SCHEMA IF EXISTS `full-stack-ecommerce`;
CREATE SCHEMA `full-stack-ecommerce`;
USE `full-stack-ecommerce`;

CREATE TABLE product_category (
  id BIGINT NOT NULL AUTO_INCREMENT,
  category_name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_category_name (category_name)
) ENGINE=InnoDB;

CREATE TABLE product (
  id BIGINT NOT NULL AUTO_INCREMENT,
  sku VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  brand VARCHAR(100),
  unit_price DECIMAL(13,2) NOT NULL,
  discount_price DECIMAL(13,2),
  image_url VARCHAR(255),
  active BIT NOT NULL DEFAULT 1,
  units_in_stock INT NOT NULL DEFAULT 0,
  rating DECIMAL(3,2),
  review_count INT NOT NULL DEFAULT 0,
  version BIGINT NOT NULL DEFAULT 0,
  date_created DATETIME(6) DEFAULT NULL,
  last_updated DATETIME(6) DEFAULT NULL,
  category_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_product_sku (sku),
  KEY idx_product_category_active (category_id, active),
  KEY idx_product_name (name),
  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES product_category(id)
) ENGINE=InnoDB;

INSERT INTO product_category(category_name) VALUES
('Laptops'), ('Smartphones'), ('Tablets'), ('Monitors'),
('Headphones'), ('Earbuds'), ('Speakers'), ('Keyboards'),
('Mice'), ('Webcams'), ('Chargers & Hubs'), ('Gaming');

INSERT INTO product
(sku,name,description,brand,unit_price,discount_price,image_url,active,units_in_stock,rating,review_count,version,date_created,last_updated,category_id)
VALUES
('TECH-LAP-1001','AeroBook 14 Pro','14-inch productivity laptop with a fast processor, crisp display and all-day battery.','Aero',89999,84999,'assets/images/products/tech/laptop.svg',1,18,4.7,128,0,NOW(),NOW(),1),
('TECH-LAP-1002','WorkMate 15','15.6-inch laptop designed for everyday work, study and multitasking.','Nova',69999,64999,'assets/images/products/tech/laptop.svg',1,24,4.5,94,0,NOW(),NOW(),1),
('TECH-PHN-1001','PixelWave X','Premium 5G smartphone with a bright OLED display and flagship camera system.','PixelWave',74999,69999,'assets/images/products/tech/smartphones.svg',1,30,4.8,211,0,NOW(),NOW(),2),
('TECH-PHN-1002','Nova One','Balanced 5G smartphone with a smooth display and reliable all-day battery.','Nova',42999,39999,'assets/images/products/tech/smartphones.svg',1,42,4.4,87,0,NOW(),NOW(),2),
('TECH-TAB-1001','TabView 11','11-inch tablet for entertainment, notes, browsing and light productivity.','TabView',32999,29999,'assets/images/products/tech/tablets.svg',1,27,4.6,71,0,NOW(),NOW(),3),
('TECH-MON-1001','Vision 27 QHD','27-inch QHD monitor with accurate colours and a comfortable productivity setup.','Vision',31999,28999,'assets/images/products/tech/monitors.svg',1,16,4.7,62,0,NOW(),NOW(),4),
('TECH-HDP-1001','Studio ANC 700','Wireless over-ear headphones with active noise cancellation and rich sound.','SoundPeak',18999,15999,'assets/images/products/tech/headphones.svg',1,35,4.8,183,0,NOW(),NOW(),5),
('TECH-HDP-1002','Everyday Wireless','Comfortable wireless headphones for calls, commuting and casual listening.','SoundPeak',7999,6999,'assets/images/products/tech/headphones.svg',1,52,4.3,76,0,NOW(),NOW(),5),
('TECH-EBU-1001','AirBeat Pro','Compact ANC earbuds with a charging case and low-latency mode.','AirBeat',12999,10999,'assets/images/products/tech/earbuds.svg',1,48,4.6,119,0,NOW(),NOW(),6),
('TECH-SPK-1001','HomeSound Mini','Compact smart speaker with room-filling audio and voice controls.','HomeSound',5999,4999,'assets/images/products/tech/speakers.svg',1,38,4.4,65,0,NOW(),NOW(),7),
('TECH-KEY-1001','TypeFlow Mechanical','Hot-swappable mechanical keyboard with RGB lighting and tactile switches.','TypeFlow',8999,7499,'assets/images/products/tech/keyboards.svg',1,29,4.7,102,0,NOW(),NOW(),8),
('TECH-KEY-1002','Slim Office Keyboard','Low-profile wireless keyboard built for quiet everyday typing.','TypeFlow',3499,NULL,'assets/images/products/tech/keyboards.svg',1,55,4.2,44,0,NOW(),NOW(),8),
('TECH-MOU-1001','Precision M7','Ergonomic wireless mouse with programmable buttons and precise tracking.','Precision',4999,3999,'assets/images/products/tech/mice.svg',1,61,4.6,93,0,NOW(),NOW(),9),
('TECH-MOU-1002','Swift Wireless Mouse','Lightweight wireless mouse for work, study and travel.','Swift',1999,NULL,'assets/images/products/tech/mice.svg',1,90,4.3,58,0,NOW(),NOW(),9),
('TECH-WEB-1001','ClearCam 1080','Full HD webcam with autofocus and dual microphones for video calls.','ClearCam',4999,4299,'assets/images/products/tech/webcams.svg',1,33,4.5,69,0,NOW(),NOW(),10),
('TECH-CHR-1001','65W GaN Charger','Compact 65W USB-C GaN charger for laptops, phones and tablets.','VoltEdge',3999,3299,'assets/images/products/tech/chargers.svg',1,74,4.8,154,0,NOW(),NOW(),11),
('TECH-CHR-1002','USB-C Hub 7-in-1','Seven-port USB-C hub with HDMI, USB, SD and power delivery.','VoltEdge',4499,3799,'assets/images/products/tech/chargers.svg',1,46,4.5,81,0,NOW(),NOW(),11),
('TECH-GAM-1001','GamePad X','Wireless controller with low-latency connectivity and precision controls.','GameForge',6999,5999,'assets/images/products/tech/gaming.svg',1,31,4.6,88,0,NOW(),NOW(),12),
('TECH-GAM-1002','Arena Headset','Gaming headset with surround sound, detachable mic and memory foam pads.','GameForge',8999,7499,'assets/images/products/tech/gaming.svg',1,22,4.7,104,0,NOW(),NOW(),12);
