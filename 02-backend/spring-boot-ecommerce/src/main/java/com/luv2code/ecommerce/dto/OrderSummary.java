package com.luv2code.ecommerce.dto;

import java.math.BigDecimal;
import java.util.Date;

import com.luv2code.ecommerce.entity.Order;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OrderSummary {
    private Long id;
    private String orderTrackingNumber;
    private BigDecimal totalPrice;
    private int totalQuantity;
    private String status;
    private Date dateCreated;

    public static OrderSummary from(Order order) {
        return new OrderSummary(
            order.getId(),
            order.getOrderTrackingNumber(),
            order.getTotalPrice(),
            order.getTotalQuantity(),
            order.getStatus(),
            order.getDateCreated()
        );
    }
}
