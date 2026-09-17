package com.luv2code.ecommerce.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import com.luv2code.ecommerce.entity.Order;

@RepositoryRestResource(exported = false)
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerAuthSubjectOrderByDateCreatedDesc(String authSubject);
    Optional<Order> findByPaymentIntentId(String paymentIntentId);
}
