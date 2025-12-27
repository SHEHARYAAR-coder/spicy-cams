'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Footer() {
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    
    // Hide footer on dashboard routes
    const hiddenRoutes = ['/dashboard', '/m', '/inbox', '/finances', '/streaming', '/profile'];
    const shouldHideFooter = hiddenRoutes.some(route => pathname.startsWith(route));
    
    if (shouldHideFooter) {
        return null;
    }

    return (
        <footer className={`bg-gray-900/95 text-gray-300 pt-12 pb-6 ${isHomePage ? 'lg:ms-56' : ''}`}>
            <div className="container mx-auto px-4">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="flex flex-column items-center space-x-2">
                                <img
                                    src="/logo/logo.png"
                                    alt="SpicyCams Logo"
                                    className="h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                                />
                                <p className="text-white font-bold text-xl">SPICYCAMS</p>
                            </div>
                        </Link>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Welcome to spicycams! We're a free online community where you can come and watch our amazing amateur models perform live interactive shows.
                        </p>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            spicycams is 100% free and access is instant. Browse through hundreds of models from Women, Men, Couples, and Transsexuals performing live sex shows 24/7. Besides watching free live cam shows, you also have the option for Private shows, spying, Cam to Cam, and messaging models.
                        </p>
                        <p className="text-xs text-gray-500">
                            All models appearing on this site have contractually confirmed to us that they are 18 years of age or older.
                        </p>
                    </div>

                    {/* Legal & Safety */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                            Legal & Safety
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/privacy" className="text-sm hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-sm hover:text-white transition-colors">
                                    Terms of Use
                                </Link>
                            </li>
                            <li>
                                <Link href="/dmca" className="text-sm hover:text-white transition-colors">
                                    DMCA Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookies" className="text-sm hover:text-white transition-colors">
                                    Cookies Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/parental-control" className="text-sm hover:text-white transition-colors">
                                    Parental Control Guide
                                </Link>
                            </li>
                            <li>
                                <Link href="/eu-research" className="text-sm hover:text-white transition-colors">
                                    EU Research Program
                                </Link>
                            </li>
                            <li>
                                <Link href="/anti-slavery" className="text-sm hover:text-white transition-colors">
                                    Anti-Slavery Help
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Work With Us */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                            Work With Us
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/affiliate" className="text-sm hover:text-white transition-colors">
                                    Affiliate Program
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Help & Support */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                            Help & Support
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/support" className="text-sm hover:text-white transition-colors">
                                    Support & FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/billing" className="text-sm hover:text-white transition-colors">
                                    Billing Support
                                </Link>
                            </li>
                        </ul>

                        {/* Mobile App Section */}
                        <div className="mt-8">
                            <div className="bg-[#252525] p-4 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                                        <div className="w-14 h-14 bg-black rounded">
                                            {/* QR Code placeholder */}
                                            <div className="w-full h-full grid grid-cols-4 gap-[1px] p-1">
                                                {Array.from({ length: 16 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`${i % 3 === 0 ? 'bg-white' : 'bg-black'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold text-sm mb-1">
                                            Get spicycams App
                                        </h4>
                                        <p className="text-xs text-gray-400">
                                            For quick mobile access & notifications, scan the QR code with your phone camera
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compliance Badges */}
                <div className="flex flex-wrap items-center justify-center gap-6 py-6 border-t border-gray-800">
                    <div className="flex items-center space-x-2">
                        <div className="bg-gray-700 px-3 py-1 rounded text-xs font-bold text-white">
                            RTA
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="text-xs text-gray-500">
                            SafeLabeling.org<br />
                            <span className="text-[10px]">COMPLIANT WEBSITE</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="bg-gray-700 px-3 py-1 rounded text-xs font-bold text-white">
                            ASACP
                        </div>
                    </div>
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">18+</span>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="text-xs text-gray-500 text-center md:text-left">
                            <Link href="/compliance" className="hover:text-gray-400">
                                18 U.S.C. 2257 Record-Keeping Requirements Compliance Statement
                            </Link>
                        </div>
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">18+</span>
                        </div>
                    </div>
                    <div className="text-xs text-gray-600 text-center mt-4">
                        © {new Date().getFullYear()} spicycams
                    </div>
                    <div className="text-xs text-gray-600 text-center mt-2">
                        Your Company Ltd, Address Line 1, City, Postal Code, Country
                    </div>
                </div>
            </div>
        </footer>
    );
}
