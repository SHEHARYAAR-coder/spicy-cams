"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";

interface BalanceData {
  balance: number;
  currency: string;
}

interface UseBalanceReturn {
  balance: number | null;
  isLoading: boolean;
  error: string | null;
  isLowBalance: boolean;
  isNewUser: boolean;
  refreshBalance: () => Promise<void>;
}

const LOW_BALANCE_THRESHOLD = 100;
const NEW_USER_THRESHOLD = 0; // New users start with 0 balance

export function useBalance(): UseBalanceReturn {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCheckedInitially, setHasCheckedInitially] = useState(false);
  
  // Use ref to track if we've already shown notifications to prevent repeated shows
  const hasShownNotification = useRef(false);

  const isViewer = session?.user && (session.user as any).role === "VIEWER";
  const isAuthenticated = status === "authenticated";

  const fetchBalance = useCallback(async (): Promise<number | null> => {
    if (!isAuthenticated || !isViewer) {
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/wallet/balance", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BalanceData = await response.json();
      const balanceValue = Number(data.balance) || 0;
      
      setBalance(balanceValue);
      return balanceValue;
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch balance";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isViewer]);

  const refreshBalance = useCallback(async (): Promise<void> => {
    await fetchBalance();
  }, [fetchBalance]);

  // Initial fetch when session is ready
  useEffect(() => {
    if (isAuthenticated && isViewer && !hasCheckedInitially) {
      setHasCheckedInitially(true);
      fetchBalance();
    }
  }, [isAuthenticated, isViewer, hasCheckedInitially, fetchBalance]);

  // Reset state when user logs out
  useEffect(() => {
    if (status === "unauthenticated") {
      setBalance(null);
      setError(null);
      setHasCheckedInitially(false);
      hasShownNotification.current = false;
    }
  }, [status]);

  // Calculate derived values
  const isLowBalance = balance !== null && balance < LOW_BALANCE_THRESHOLD;
  const isNewUser = balance !== null && balance <= NEW_USER_THRESHOLD;

  return {
    balance,
    isLoading,
    error,
    isLowBalance,
    isNewUser,
    refreshBalance,
  };
}

// Hook to manage notification state
export function useBalanceNotifications() {
  const { balance, isLowBalance, isNewUser } = useBalance();
  const [showNotification, setShowNotification] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [hasShownForSession, setHasShownForSession] = useState(false);

  // Show notification when balance is checked and conditions are met
  useEffect(() => {
    if (
      balance !== null && 
      !hasShownForSession && 
      (isLowBalance || isNewUser)
    ) {
      // Small delay to ensure smooth UI
      const timer = setTimeout(() => {
        setShowNotification(true);
        setHasShownForSession(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [balance, isLowBalance, isNewUser, hasShownForSession]);

  const handleCloseNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  const handleBuyTokens = useCallback(() => {
    setShowNotification(false);
    setShowTokenModal(true);
  }, []);

  const handleCloseTokenModal = useCallback(() => {
    setShowTokenModal(false);
  }, []);

  // Reset notification state when user logs out or session changes
  const { status } = useSession();
  useEffect(() => {
    if (status === "unauthenticated") {
      setShowNotification(false);
      setShowTokenModal(false);
      setHasShownForSession(false);
    }
  }, [status]);

  return {
    balance,
    isLowBalance,
    isNewUser,
    showNotification,
    showTokenModal,
    handleCloseNotification,
    handleBuyTokens,
    handleCloseTokenModal,
  };
}