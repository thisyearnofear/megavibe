// PaymentDialog.tsx

import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { api, initiatePayment as initiateStripePayment } from "../services/api";

type PaymentDialogProps = {
  selectedAction: string;
  totalAmount: number;
  artistName: string;
  selectedSong?: string; // Optional for setting a bounty
  onClose: () => void;
};

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  selectedAction,
  totalAmount,
  artistName,
  selectedSong,
  onClose,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState<string | null>(null); // State to store payment error

  const handlePay = async () => {
    if (stripe && elements) {
      // Ensure both stripe and elements are available
      try {
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: elements.getElement(CardElement)!,
        });

        if (!error) {
          // Payment method created successfully, initiate payment with the method ID
          const response = await initiatePayment(paymentMethod.id);

          if (response && response.error) {
            // Handle payment errors returned by your server
            setPaymentError(response.error);
          } else {
            // Payment successful, close the dialog or perform any other action
            console.log("Payment successful");
            onClose();
          }
        } else {
          // Stripe validation error
          setPaymentError(error.message || "An error occurred.");
        }
      } catch (error) {
        // Network or unexpected error
        console.error("Payment request error:", error);
        setPaymentError("An error occurred during payment processing.");
      }
    } else {
      console.error("Stripe or elements is not available");
    }
  };

  return (
    <div className="payment-dialog-overlay">
      {/* Apply the payment-dialog-overlay class here */}
      <div className="confirmation-box">
        {/* Add specific styles to the confirmation-box */}
        <h2>{selectedAction} Confirmation</h2>
        <p>
          You would like to {selectedAction.toLowerCase()} for £{totalAmount} to{" "}
          {artistName}
          {selectedAction === "Set A Bounty" ? (
            <span> to play the song "{selectedSong}"</span>
          ) : (
            ""
          )}
          .
        </p>

        {/* Add CardElement here */}
        <CardElement />

        <div className="confirmation-buttons">
          <button onClick={onClose}>Cancel</button>
          {/* Add a specific class for this button */}
          <button className="custom-confirm-button" onClick={handlePay}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDialog;

export const initiatePayment = async (paymentMethodId: string) => {
  try {
    const response = await api.post("/api/payments/create", {
      paymentMethodId,
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
