"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import styles from "./page.module.css";
import BountyCreationForm from "@/components/bounties/BountyCreationForm";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import WalletConnect from "@/components/wallet/WalletConnect";

export default function CreateBountyPage() {
  const router = useRouter();
  const { isConnected } = useWalletConnection();
  const [success, setSuccess] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSuccess = () => {
    setSuccess(true);

    // Redirect back to bounties list after success
    setTimeout(() => {
      router.push("/bounties");
    }, 3000);
  };

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.content}
      >
        <button onClick={handleBack} className={styles.backButton}>
          <FaArrowLeft /> Back to Bounties
        </button>

        <h1 className={styles.title}>Create a Bounty</h1>
        <p className={styles.subtitle}>
          Specify the details for your bounty and publish it to the network
        </p>

        {success ? (
          <div className={styles.successMessage}>
            <h2>Bounty Created Successfully!</h2>
            <p>
              Your bounty has been published to the network. Redirecting to
              bounties list...
            </p>
          </div>
        ) : isConnected ? (
          <BountyCreationForm onSuccess={handleSuccess} />
        ) : (
          <div className={styles.walletPrompt}>
            <h2>Connect Your Wallet</h2>
            <p>
              You need to connect your wallet to create a bounty. Please connect
              using one of the options below:
            </p>
            <div className={styles.walletConnect}>
              <WalletConnect />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
