"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./MobileBottomNav.module.css";
import { Home, PlusSquare, BarChart2 } from "lucide-react";
import CoachMark from "@/components/shared/CoachMark";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const navItems = [
  { href: "/", label: "Discover", icon: <Home size={24} />, message: "Explore performers and events near you!" },
  { href: "/profile", label: "Profile", icon: <BarChart2 size={24} />, message: "See your impact and activity here." },
  { href: "/create", label: "Create", icon: <PlusSquare size={24} />, message: "Create bounties or new content." },
];

const MobileBottomNav = () => {
  const pathname = usePathname();
  const { hasCompletedOnboarding, setHasCompletedOnboarding } = useOnboarding();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [showCoachMark, setShowCoachMark] = useState(false);
  const [currentCoachMarkIndex, setCurrentCoachMarkIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (isMobile && !hasCompletedOnboarding) {
      // Only show coach marks if on mobile and onboarding not completed
      setShowCoachMark(true);
    }
  }, [isMobile, hasCompletedOnboarding]);

  const handleDismissCoachMark = () => {
    if (currentCoachMarkIndex < navItems.length - 1) {
      setCurrentCoachMarkIndex(currentCoachMarkIndex + 1);
    } else {
      setShowCoachMark(false);
      setHasCompletedOnboarding(true); // Mark onboarding as complete
    }
  };

  if (!isMobile) {
    return null; // Only render on mobile
  }

  const currentItem = navItems[currentCoachMarkIndex];

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.navContainer}>
        {navItems.map((item, index) => (
          <Link href={item.href} key={item.href} className={styles.navLink}>
            <div
              ref={(el) => { itemRefs.current[index] = el; }}
              className={`${styles.navItem} ${
                pathname === item.href ? styles.active : ""
              }`}
            >
              {item.icon}
              <span className={styles.navLabel}>{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
      {showCoachMark && currentItem && itemRefs.current[currentCoachMarkIndex] && (
        <CoachMark
          message={currentItem.message}
          isVisible={true}
          onDismiss={handleDismissCoachMark}
          targetRef={{ current: itemRefs.current[currentCoachMarkIndex] }}
        />
      )}
    </nav>
  );
};

export default MobileBottomNav;
