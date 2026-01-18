"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageLoader } from "./page-loader";

function LoadingWatcher() {
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Show loader on route change
        setIsLoading(true);

        // Hide loader after minimum display time
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    return isLoading ? <PageLoader /> : null;
}

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={<PageLoader />}>
                <LoadingWatcher />
            </Suspense>
            {children}
        </>
    );
}
