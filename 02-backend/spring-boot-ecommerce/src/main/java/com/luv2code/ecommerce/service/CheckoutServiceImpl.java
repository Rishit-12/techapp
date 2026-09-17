package com.luv2code.ecommerce.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.luv2code.ecommerce.dao.CustomerRepository;
import com.luv2code.ecommerce.dao.OrderRepository;
import com.luv2code.ecommerce.dao.ProductRepository;
import com.luv2code.ecommerce.dto.Purchase;
import com.luv2code.ecommerce.dto.PurchaseResponse;
import com.luv2code.ecommerce.entity.Customer;
import com.luv2code.ecommerce.entity.Order;
import com.luv2code.ecommerce.entity.OrderItem;
import com.luv2code.ecommerce.entity.Product;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.net.RequestOptions;
import com.stripe.param.RefundCreateParams;

@Service
public class CheckoutServiceImpl implements CheckoutService {

    private static final Logger log = LoggerFactory.getLogger(CheckoutServiceImpl.class);
    private static final BigDecimal MINIMUM_ORDER_VALUE = new BigDecimal("50.00");
    private static final String CURRENCY = "inr";

    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public CheckoutServiceImpl(
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            OrderRepository orderRepository,
            @Value("${stripe.key.secret:}") String secretKey) {
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;

        if (secretKey != null && !secretKey.isBlank()) {
            Stripe.apiKey = secretKey;
        }
    }

    @Override
    @Transactional
    public PurchaseResponse placeOrder(Purchase purchase, String authSubject, String authEmail) throws StripeException {
        validateCheckoutPayload(purchase, authSubject);

        var existingOrder = orderRepository.findByPaymentIntentId(purchase.getPaymentIntentId());
        if (existingOrder.isPresent()) {
            return new PurchaseResponse(existingOrder.get().getOrderTrackingNumber());
        }

        PaymentIntent paymentIntent = PaymentIntent.retrieve(purchase.getPaymentIntentId());

        if (!"succeeded".equals(paymentIntent.getStatus())) {
            throw new IllegalArgumentException("Payment has not been completed.");
        }

        String paymentSubject = paymentIntent.getMetadata() == null
                ? null
                : paymentIntent.getMetadata().get("auth_subject");

        if (paymentSubject != null && !authSubject.equals(paymentSubject)) {
            throw new IllegalArgumentException("Payment does not belong to the signed-in customer.");
        }

        BigDecimal serverTotal = calculateAndValidateItems(purchase.getOrderItems());
        long expectedAmount = serverTotal.movePointRight(2).longValueExact();

        if (paymentIntent.getAmount() == null
                || paymentIntent.getAmount() != expectedAmount
                || !CURRENCY.equalsIgnoreCase(paymentIntent.getCurrency())) {
            throw new IllegalArgumentException("Payment amount does not match the order.");
        }

        try {
            Customer requestCustomer = purchase.getCustomer();
            Customer customer = customerRepository.findByAuthSubject(authSubject).orElse(null);

            if (customer == null) {
                customer = customerRepository.findByEmail(requestCustomer.getEmail());
            }

            if (customer == null) {
                customer = new Customer();
                customer.setAuthSubject(authSubject);
                customer.setEmail(preferredEmail(authEmail, requestCustomer.getEmail()));
            }

            customer.setAuthSubject(authSubject);
            customer.setFirstName(requestCustomer.getFirstName());
            customer.setLastName(requestCustomer.getLastName());

            Order order = purchase.getOrder();
            order.setOrderTrackingNumber(generateOrderTrackingNumber());
            order.setPaymentIntentId(purchase.getPaymentIntentId());
            order.setTotalPrice(serverTotal);
            order.setTotalQuantity(calculateTotalQuantity(purchase.getOrderItems()));
            order.setStatus("PLACED");

            for (OrderItem item : purchase.getOrderItems()) {
                Product product = productRepository.findById(item.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException("Product not found: " + item.getProductId()));

                validateProductForOrder(product, item.getQuantity());

                BigDecimal effectivePrice = effectivePrice(product);
                item.setUnitPrice(effectivePrice);
                item.setImageUrl(product.getImageUrl());

                order.add(item);
                product.setUnitsInStock(product.getUnitsInStock() - item.getQuantity());
            }

            order.setBillingAddress(purchase.getBillingAddress());
            order.setShippingAddress(purchase.getShippingAddress());
            customer.add(order);

            customerRepository.save(customer);
            return new PurchaseResponse(order.getOrderTrackingNumber());
        } catch (RuntimeException ex) {
            // The card has already been charged. Attempt to reverse the payment so
            // a stock/database failure does not leave the customer permanently charged.
            try {
                RefundCreateParams refundParams = RefundCreateParams.builder()
                        .setPaymentIntent(purchase.getPaymentIntentId())
                        .build();
                Refund.create(refundParams);
            } catch (StripeException refundException) {
                log.error("Order creation failed and automatic refund also failed for payment intent {}",
                        purchase.getPaymentIntentId());
            }
            throw ex;
        }
    }

    @Override
    public PaymentIntent createPaymentIntent(
            Purchase purchase,
            String authSubject,
            String authEmail,
            String idempotencyKey) throws StripeException {

        validateCart(purchase);
        BigDecimal serverTotal = calculateAndValidateItems(purchase.getOrderItems());

        if (serverTotal.compareTo(MINIMUM_ORDER_VALUE) < 0) {
            throw new IllegalArgumentException("Minimum order value is ₹50.");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("amount", serverTotal.movePointRight(2).longValueExact());
        params.put("currency", CURRENCY);
        params.put("payment_method_types", List.of("card"));
        params.put("description", "TechStore purchase");
        params.put("metadata", Map.of("auth_subject", authSubject));

        String receiptEmail = preferredEmail(
                authEmail,
                purchase.getCustomer() == null ? null : purchase.getCustomer().getEmail()
        );

        if (receiptEmail != null && !receiptEmail.isBlank()) {
            params.put("receipt_email", receiptEmail.trim());
        }

        RequestOptions.RequestOptionsBuilder options = RequestOptions.builder();
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            options.setIdempotencyKey(idempotencyKey.trim());
        }

        return PaymentIntent.create(params, options.build());
    }

    private BigDecimal calculateAndValidateItems(Set<OrderItem> items) {
        validateCartItemsPresent(items);

        BigDecimal total = BigDecimal.ZERO;

        for (OrderItem item : items) {
            if (item == null || item.getProductId() == null || item.getQuantity() <= 0 || item.getQuantity() > 50) {
                throw new IllegalArgumentException("Invalid cart item.");
            }

            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + item.getProductId()));

            validateProductForOrder(product, item.getQuantity());
            total = total.add(effectivePrice(product).multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        return total;
    }

    private void validateProductForOrder(Product product, int quantity) {
        if (!product.isActive()) {
            throw new IllegalArgumentException(product.getName() + " is no longer available.");
        }

        if (product.getUnitsInStock() < quantity) {
            throw new IllegalArgumentException(product.getName() + " does not have enough stock.");
        }
    }

    private BigDecimal effectivePrice(Product product) {
        if (product.getDiscountPrice() != null
                && product.getDiscountPrice().compareTo(product.getUnitPrice()) < 0) {
            return product.getDiscountPrice();
        }
        return product.getUnitPrice();
    }

    private int calculateTotalQuantity(Set<OrderItem> items) {
        return items.stream().mapToInt(OrderItem::getQuantity).sum();
    }

    private void validateCheckoutPayload(Purchase purchase, String authSubject) {
        if (authSubject == null || authSubject.isBlank()) {
            throw new IllegalArgumentException("Authenticated customer is required.");
        }

        validateCart(purchase);

        if (purchase.getPaymentIntentId() == null || purchase.getPaymentIntentId().isBlank()) {
            throw new IllegalArgumentException("Payment intent is required.");
        }

        if (purchase.getCustomer() == null
                || purchase.getShippingAddress() == null
                || purchase.getBillingAddress() == null
                || purchase.getOrder() == null) {
            throw new IllegalArgumentException("Incomplete checkout information.");
        }

        validateText(purchase.getCustomer().getFirstName(), "First name");
        validateText(purchase.getCustomer().getLastName(), "Last name");
        validateText(purchase.getCustomer().getEmail(), "Email");

        validateAddress(purchase.getShippingAddress());
        validateAddress(purchase.getBillingAddress());
    }

    private void validateCart(Purchase purchase) {
        if (purchase == null) {
            throw new IllegalArgumentException("Checkout information is required.");
        }
        validateCartItemsPresent(purchase.getOrderItems());
    }

    private void validateCartItemsPresent(Set<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Cart cannot be empty.");
        }
    }

    private void validateAddress(com.luv2code.ecommerce.entity.Address address) {
        validateText(address.getStreet(), "Street address");
        validateText(address.getCity(), "City");
        validateText(address.getState(), "State");
        validateText(address.getCountry(), "Country");
        validateText(address.getZipCode(), "Postal code");
    }

    private void validateText(String value, String field) {
        if (value == null || value.isBlank() || value.trim().length() < 2) {
            throw new IllegalArgumentException(field + " is required.");
        }
    }

    private String preferredEmail(String authEmail, String fallbackEmail) {
        if (authEmail != null && !authEmail.isBlank()) {
            return authEmail.trim();
        }
        return fallbackEmail == null ? null : fallbackEmail.trim();
    }

    private String generateOrderTrackingNumber() {
        return UUID.randomUUID().toString();
    }
}
