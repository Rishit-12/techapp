package com.luv2code.ecommerce.dto;

import java.util.Set;

import com.luv2code.ecommerce.entity.Address;
import com.luv2code.ecommerce.entity.Customer;
import com.luv2code.ecommerce.entity.Order;
import com.luv2code.ecommerce.entity.OrderItem;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class Purchase {

    @Valid
    @NotNull
    private Customer customer;

    @Valid
    @NotNull
    private Address shippingAddress;

    @Valid
    @NotNull
    private Address billingAddress;

    @Valid
    @NotNull
    private Order order;

    @NotEmpty
    private Set<OrderItem> orderItems;

    private String paymentIntentId;
}
