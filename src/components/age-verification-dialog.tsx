"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export function AgeVerificationDialog() {
    const [showAgeVerification, setShowAgeVerification] = useState(false);

    // Check age verification on mount
    useEffect(() => {
        const hasVerified = localStorage.getItem('ageVerified');
        if (hasVerified !== 'true') {
            setShowAgeVerification(true);
        }
    }, []);

    // Handle age verification
    const handleAgeVerification = () => {
        localStorage.setItem('ageVerified', 'true');
        setShowAgeVerification(false);
    };

    return (
        <Dialog open={showAgeVerification} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700 text-white" showCloseButton={false}>
                <div className="p-6">
                    {/* Disclaimer Section */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Disclaimer</h2>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">
                            The pages of this website contain explicit material and are not suitable for minors. If you are a minor (-18year)
                            or do not wish to be confronted with explicit websites, please leave this website by clicking on{' '}
                            <span className="font-semibold">Exit</span> below. By clicking on{' '}
                            <span className="font-semibold">Enter</span> below you expressly confirm that you are of age and agree with this website's user
                            agreement. All models on this website are at least 18 years old. Parents, protect your children against explicit
                            websites using one of the following programs.
                        </p>
                    </div>

                    {/* Cookie Policy Section */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-3">Cookie policy</h3>
                        <p className="text-gray-300 text-sm leading-relaxed mb-2">
                            This site uses cookies to analyze the website, to make it more user-friendly and to offer you products tailored to
                            your needs. By using the site, you accept the terms of the{' '}
                            <a href="#" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</a>
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleAgeVerification}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
                        >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            I'm 18 or older – Enter
                        </Button>

                        <Button
                            onClick={() => window.location.href = 'https://google.com'}
                            variant="outline"
                            className="w-full border-gray-600 text-gray-900 hover:text-gray-200 hover:bg-gray-700 py-3 rounded-lg font-medium"
                        >
                            <XCircle className="w-5 h-5 mr-2" />
                            I'm under 18 – Exit
                        </Button>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-gray-300 mb-2">
                                    Access to explicit content is restricted until your age has been verified.
                                </p>
                                <div className="flex flex-wrap gap-4 text-xs text-purple-400">
                                    <a href="#" className="hover:text-purple-300 underline">BIK+</a>
                                    <span className="text-gray-500">|</span>
                                    <a href="#" className="hover:text-purple-300 underline">RTA</a>
                                    <span className="text-gray-500">|</span>
                                    <a href="#" className="hover:text-purple-300 underline">ASACP</a>
                                    <span className="text-gray-500">|</span>
                                    <a href="#" className="hover:text-purple-300 underline">Netnanny</a>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    18 U.S.C 2257 Record-Keeping Requirements<br />
                                    Compliance Statement
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}