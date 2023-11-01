import React, { useState, useEffect } from "react";
import {
  PaymentRequestButtonElement,
  useStripe,
} from "@stripe/react-stripe-js";
import { PaymentRequest } from "@stripe/stripe-js";

interface CheckoutFormProps {
  clientSecret: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ clientSecret }) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null
  );

  useEffect(() => {
    if (stripe) {
      // Create a PaymentRequest object with the required options
      const pr = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: {
          label: "Demo total",
          amount: 1099, // Amount in cents (e.g., $10.99)
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      // Check if the Payment Request API is available
      pr.canMakePayment().then((result) => {
        if (result) {
          setPaymentRequest(pr); // Update state when payment request is available
        }
      });
    }
  }, [stripe]);

  const handlePaymentRequest = async () => {
    if (paymentRequest) {
      try {
        // Show the payment request form to the user
        const paymentResponse = await paymentRequest.show();

        (paymentResponse as any).complete("success"); // Simulate a successful payment for demo purposes
        // In a real scenario, you would handle the payment based on the response
        // and communicate with your server to confirm the payment.
      } catch (error) {
        console.error("Payment request error:", error);
      }
    }
  };

  if (paymentRequest) {
    return <PaymentRequestButtonElement options={{ paymentRequest }} />;
  }

  // Render your custom form or button here
  return <button onClick={handlePaymentRequest}>Confirm Payment</button>;
};

export default CheckoutForm;
