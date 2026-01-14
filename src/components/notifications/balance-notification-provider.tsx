"use client";

import { useBalanceNotifications } from "@/hooks/use-balance";
import { LowBalanceNotification } from "@/components/notifications/low-balance-notification";
import { TokenPurchaseModal } from "@/components/notifications/token-purchase-modal";

/**
 * BalanceNotificationProvider
 * 
 * This component automatically handles showing balance notifications for viewers:
 * - Low balance alerts (when balance < 100 tokens)
 * - New user welcome (when balance = 0 tokens)
 * - Token purchase modal integration
 * 
 * Should be placed high in the component tree to work across all pages
 */
export function BalanceNotificationProvider() {
    const {
        balance,
        isLowBalance,
        isNewUser,
        showNotification,
        showTokenModal,
        handleCloseNotification,
        handleBuyTokens,
        handleCloseTokenModal,
    } = useBalanceNotifications();

    return (
        <>
            {/* Low Balance / New User Notification */}
            {showNotification && balance !== null && (
                <LowBalanceNotification
                    isOpen={showNotification}
                    onClose={handleCloseNotification}
                    balance={balance}
                    isNewUser={isNewUser}
                    onBuyTokens={handleBuyTokens}
                />
            )}

            {/* Token Purchase Modal */}
            {showTokenModal && (
                <TokenPurchaseModal
                    isOpen={showTokenModal}
                    onClose={handleCloseTokenModal}
                    isNewUser={isNewUser}
                />
            )}
        </>
    );
}