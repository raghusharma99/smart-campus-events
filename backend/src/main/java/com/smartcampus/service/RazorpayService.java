package com.smartcampus.service;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Razorpay Payment Service
 * Handles order creation and payment verification
 */
@Service
public class RazorpayService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    /**
     * Create a Razorpay order
     * Amount is in paise (1 INR = 100 paise)
     */
    public Map<String, Object> createOrder(BigDecimal amount, String currency,
                                            String receipt) throws RazorpayException {

        RazorpayClient client = new RazorpayClient(keyId, keySecret);

        JSONObject orderRequest = new JSONObject();
        // Convert rupees to paise
        orderRequest.put("amount", amount.multiply(new BigDecimal("100")).intValue());
        orderRequest.put("currency", currency != null ? currency : "INR");
        orderRequest.put("receipt", receipt);
        orderRequest.put("payment_capture", 1); // auto capture payment

        Order order = client.orders.create(orderRequest);

        Map<String, Object> result = new HashMap<>();
        result.put("orderId",  order.get("id"));
        result.put("amount",   order.get("amount"));
        result.put("currency", order.get("currency"));
        result.put("receipt",  order.get("receipt"));
        result.put("status",   order.get("status"));
        result.put("keyId",    keyId);   // send key_id to frontend

        return result;
    }

    /**
     * Verify payment signature after payment is done
     * This is MANDATORY — prevents fraud
     */
    public boolean verifyPaymentSignature(String razorpayOrderId,
                                          String razorpayPaymentId,
                                          String razorpaySignature) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id",   razorpayOrderId);
            attributes.put("razorpay_payment_id",  razorpayPaymentId);
            attributes.put("razorpay_signature",   razorpaySignature);

            // This method verifies the HMAC-SHA256 signature
            Utils.verifyPaymentSignature(attributes, keySecret);
            return true;

        } catch (RazorpayException e) {
            // Signature mismatch — payment is tampered or fake
            return false;
        }
    }

    /**
     * Fetch payment details from Razorpay
     */
    public Map<String, Object> fetchPayment(String paymentId) throws RazorpayException {
        RazorpayClient client = new RazorpayClient(keyId, keySecret);
        Payment payment = client.payments.fetch(paymentId);

        Map<String, Object> result = new HashMap<>();
        result.put("id",       payment.get("id"));
        result.put("amount",   payment.get("amount"));
        result.put("currency", payment.get("currency"));
        result.put("status",   payment.get("status"));
        result.put("method",   payment.get("method"));
        result.put("email",    payment.get("email"));
        result.put("contact",  payment.get("contact"));
        return result;
    }
}
