"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageLoader } from "./page-loader";

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Show loader on initial mount
        setIsLoading(true);

        // Hide loader after minimum display time
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    return (
        <>
            {isLoading && <PageLoader />}
            {children}
        </>
    );
}
