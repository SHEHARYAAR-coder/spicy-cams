"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type CategoryType = "girls" | "couples" | "guys" | "trans";

interface CategoryContextType {
  selectedCategoryType: CategoryType;
  setSelectedCategoryType: (type: CategoryType) => void;
  showCategoryBar: boolean;
  setShowCategoryBar: (show: boolean) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [selectedCategoryType, setSelectedCategoryType] = useState<CategoryType>("girls");
  const [showCategoryBar, setShowCategoryBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleSetCategoryType = useCallback((type: CategoryType) => {
    setSelectedCategoryType(type);
  }, []);

  // Handle scroll to show/hide category bar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // At the top, always show
        setShowCategoryBar(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past threshold, hide
        setShowCategoryBar(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up, show
        setShowCategoryBar(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <CategoryContext.Provider
      value={{
        selectedCategoryType,
        setSelectedCategoryType: handleSetCategoryType,
        showCategoryBar,
        setShowCategoryBar,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryType() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error("useCategoryType must be used within a CategoryProvider");
  }
  return context;
}
