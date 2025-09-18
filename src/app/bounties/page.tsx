"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaSearch, FaPlus } from "react-icons/fa";
import BountyList from "@/components/bounties/BountyList";
import {
  BountyDetails,
  BountyStatus,
  BountyType,
} from "@/services/blockchain/types";
import styles from "./page.module.css";
import Button from "@/components/shared/Button";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import Container from "@/components/layout/Container";

export default function BountiesPage() {
  const router = useRouter();
  const { walletInfo } = useWalletConnection();
  const [bounties, setBounties] = useState<BountyDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        setLoading(true);

        // In a real implementation, we would fetch bounties from the contract
        // For now, we'll use mock data

        // Mock bounty data - would come from contract in real implementation
        const mockBounties: BountyDetails[] = [
          {
            id: "1",
            title: "Create a logo for my new album",
            description:
              'Looking for a talented designer to create a logo for my upcoming album "Ethereal Echoes". The logo should capture the electronic and ambient nature of the music.',
            amount: "0.5",
            creator: "0x1234567890123456789012345678901234567890",
            deadline: Math.floor(Date.now() / 1000) + 604800, // 1 week from now
            status: BountyStatus.OPEN,
            submissionsCount: 3,
            tags: ["Design", "Logo", "Music", "Album"],
            createdAt: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
            updatedAt: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
            type: BountyType.PERFORMER_TO_AUDIENCE,
            isCompleted: false,
          },
          {
            id: "2",
            title: "Voice over for my animated short",
            description:
              "I need a deep, resonant voice for the narrator in my 3-minute animated short about space exploration. Experience with similar work preferred.",
            amount: "0.8",
            creator: "0xabcdef1234567890abcdef1234567890abcdef12",
            deadline: Math.floor(Date.now() / 1000) + 432000, // 5 days from now
            status: BountyStatus.OPEN,
            submissionsCount: 1,
            tags: ["Voice", "Narration", "Animation"],
            createdAt: Math.floor(Date.now() / 1000) - 86400 * 5, // 5 days ago
            updatedAt: Math.floor(Date.now() / 1000) - 86400 * 5, // 5 days ago
            type: BountyType.AUDIENCE_TO_PERFORMER,
            isCompleted: false,
          },
          {
            id: "3",
            title: "Mix & master my latest track",
            description:
              "I need someone to mix and master my latest electronic track. The track is 80% complete but needs a professional touch to make it ready for release.",
            amount: "1.2",
            creator: "0x9876543210987654321098765432109876543210",
            deadline: Math.floor(Date.now() / 1000) + 259200, // 3 days from now
            status: BountyStatus.OPEN,
            submissionsCount: 0,
            tags: ["Music", "Production", "Mixing", "Mastering"],
            createdAt: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
            updatedAt: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
            type: BountyType.AUDIENCE_TO_PERFORMER,
            isCompleted: false,
          },
          {
            id: "4",
            title: "Create a music visualizer for my latest release",
            description:
              "I'm looking for someone to create a captivating music visualizer for my latest electronic track. The visualizer should match the vibe of the music and be ready for upload to YouTube.",
            amount: "0.75",
            creator: "0x1234567890123456789012345678901234567890",
            deadline: Math.floor(Date.now() / 1000) + 518400, // 6 days from now
            status: BountyStatus.OPEN,
            submissionsCount: 2,
            tags: ["Visual", "Video", "Music", "Animation"],
            createdAt: Math.floor(Date.now() / 1000) - 86400 * 4, // 4 days ago
            updatedAt: Math.floor(Date.now() / 1000) - 86400 * 4, // 4 days ago
            type: BountyType.PERFORMER_TO_AUDIENCE,
            isCompleted: false,
          },
        ];

        setBounties(mockBounties);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bounties:", err);
        setError("Failed to load bounties. Please try again later.");
        setLoading(false);
      }
    };

    fetchBounties();
  }, []);

  const handleCreateBounty = () => {
    router.push("/bounties/create");
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
  };

  const filteredBounties = bounties.filter((bounty) => {
    // Filter by search term
    const matchesSearch =
      bounty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bounty.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bounty.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Filter by type
    const matchesType =
      selectedType === "all" ||
      (selectedType === "performer-to-audience" &&
        bounty.type === BountyType.PERFORMER_TO_AUDIENCE) ||
      (selectedType === "audience-to-performer" &&
        bounty.type === BountyType.AUDIENCE_TO_PERFORMER);

    // Filter by status
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "open" && bounty.status === BountyStatus.OPEN) ||
      (selectedStatus === "completed" && bounty.isCompleted);

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Bounties</h1>
            <p className={styles.subtitle}>
              Discover opportunities or create your own bounties
            </p>
          </div>
          {walletInfo.isConnected && (
            <Button
              onClick={handleCreateBounty}
              variant="primary"
              leftIcon={<FaPlus />}
            >
              Create Bounty
            </Button>
          )}
        </header>

        <div className={styles.filters}>
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search bounties..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
            />
          </div>

          <select
            value={selectedType}
            onChange={handleTypeChange}
            className={styles.select}
          >
            <option value="all">All Types</option>
            <option value="performer-to-audience">Performer to Audience</option>
            <option value="audience-to-performer">Audience to Performer</option>
          </select>

          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className={styles.select}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
            >
              Try Again
            </Button>
          </div>
        ) : filteredBounties.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No bounties found</h3>
            <p>Try adjusting your filters or create a new bounty</p>
            {walletInfo.isConnected && (
              <Button
                onClick={handleCreateBounty}
                variant="primary"
                className={styles.createEmptyButton}
              >
                Create Bounty
              </Button>
            )}
          </div>
        ) : (
          <BountyList bounties={filteredBounties} />
        )}
      </motion.div>
    </Container>
  );
}
