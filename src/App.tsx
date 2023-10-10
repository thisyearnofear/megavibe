import React from "react";
import "./App.css";
import VibeButton from "./components/VibeButton";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  throw new Error("Stripe public key is not set in environment variables.");
}

const stripePromise = loadStripe(stripePublicKey);

function App() {
  return (
    <div className="App">
      {/* Stripe Elements setup */}
      <Elements stripe={stripePromise}>
        {/* Include your payment form component here */}
        <VibeButton />
      </Elements>
    </div>
  );
}

export default App;
