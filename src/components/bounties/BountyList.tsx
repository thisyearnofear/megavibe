import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaEthereum, FaClock, FaSearch, FaPlus } from "react-icons/fa";
import styles from "./BountyList.module.css";
import { BountyDetails, BountyType } from "@/services/blockchain/types";
import { formatEthAmount, formatDate } from "@/utils/formatting";

export interface BountyListProps {
  bounties: BountyDetails[];
}

export default function BountyList({ bounties }: BountyListProps) {
  const router = useRouter();

  const handleBountyClick = (id: string) => {
    router.push(`/bounties/${id}`);
  };

  const getImageUrl = (bounty: BountyDetails) => {
    // In a real implementation, these would come from the bounty metadata
    return bounty.type === BountyType.AUDIENCE_TO_PERFORMER
      ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop";
  };

  return (
    <div className={styles.grid}>
      {bounties.map((bounty) => (
        <motion.div
          key={bounty.id}
          className={styles.card}
          onClick={() => handleBountyClick(bounty.id)}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.cardImage}>
            <Image
              src={getImageUrl(bounty)}
              alt={bounty.title}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>{bounty.title}</h3>
            <p className={styles.cardDescription}>{bounty.description}</p>

            {bounty.tags && bounty.tags.length > 0 && (
              <div className={styles.tags}>
                {bounty.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
                {bounty.tags.length > 3 && (
                  <span className={styles.tag}>+{bounty.tags.length - 3}</span>
                )}
              </div>
            )}

            <div className={styles.cardFooter}>
              <div className={styles.reward}>
                <FaEthereum />
                <span>{formatEthAmount(bounty.amount)} ETH</span>
              </div>
              <div className={styles.deadline}>
                <FaClock />
                <span>
                  {bounty.deadline
                    ? formatDate(bounty.deadline * 1000)
                    : "No deadline"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
