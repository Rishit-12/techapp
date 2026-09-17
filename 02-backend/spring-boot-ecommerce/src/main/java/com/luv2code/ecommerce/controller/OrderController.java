package com.luv2code.ecommerce.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.luv2code.ecommerce.dao.OrderRepository;
import com.luv2code.ecommerce.dto.OrderSummary;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;

    public OrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping("/me")
    public List<OrderSummary> myOrders(@AuthenticationPrincipal Jwt jwt) {
        return orderRepository.findByCustomerAuthSubjectOrderByDateCreatedDesc(jwt.getSubject())
                .stream()
                .map(OrderSummary::from)
                .toList();
    }
}
