package com.luv2code.ecommerce.service;

import com.luv2code.ecommerce.dto.Purchase;
import com.luv2code.ecommerce.dto.PurchaseResponse;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;

public interface CheckoutService {
    PurchaseResponse placeOrder(Purchase purchase, String authSubject, String authEmail) throws StripeException;
    PaymentIntent createPaymentIntent(Purchase purchase, String authSubject, String authEmail, String idempotencyKey) throws StripeException;
}
