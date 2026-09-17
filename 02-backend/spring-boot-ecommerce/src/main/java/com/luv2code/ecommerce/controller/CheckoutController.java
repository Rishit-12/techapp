package com.luv2code.ecommerce.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.luv2code.ecommerce.dto.Purchase;
import com.luv2code.ecommerce.dto.PurchaseResponse;
import com.luv2code.ecommerce.service.CheckoutService;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/purchase")
    public PurchaseResponse placeOrder(
            @Valid @RequestBody Purchase purchase,
            @AuthenticationPrincipal Jwt jwt) throws StripeException {

        return checkoutService.placeOrder(
                purchase,
                jwt.getSubject(),
                jwt.getClaimAsString("email")
        );
    }

    @PostMapping("/payment-intent")
    public ResponseEntity<String> createPaymentIntent(
            @Valid @RequestBody Purchase purchase,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) throws StripeException {

        PaymentIntent paymentIntent = checkoutService.createPaymentIntent(
                purchase,
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                idempotencyKey
        );

        return ResponseEntity.status(HttpStatus.OK).body(paymentIntent.toJson());
    }
}
