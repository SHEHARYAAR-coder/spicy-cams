"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Camera,
    Mic,
    AlertCircle,
    CheckCircle2,
    Loader2
} from 'lucide-react';

interface MediaPermissionsProps {
    onPermissionsGranted: () => void;
    onPermissionsDenied: (error: string) => void;
}

export function MediaPermissions({ onPermissionsGranted, onPermissionsDenied }: MediaPermissionsProps) {
    const [cameraStatus, setCameraStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [micStatus, setMicStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [isRequesting, setIsRequesting] = useState(false);

    const requestPermissions = async () => {
        setIsRequesting(true);

        try {
            // Request camera permission
            const videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                }
            });
            setCameraStatus('granted');

            // Request microphone permission
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            setMicStatus('granted');

            // Stop the streams as they were just for permission testing
            videoStream.getTracks().forEach(track => track.stop());
            audioStream.getTracks().forEach(track => track.stop());

            onPermissionsGranted();

        } catch (error: any) {
            console.error('Media permissions error:', error);

            if (error.name === 'NotAllowedError') {
                setCameraStatus('denied');
                setMicStatus('denied');
                onPermissionsDenied('Camera and microphone access denied. Please enable permissions in your browser settings.');
            } else if (error.name === 'NotFoundError') {
                onPermissionsDenied('No camera or microphone found. Please connect your devices and try again.');
            } else {
                onPermissionsDenied('Failed to access media devices. Please check your camera and microphone.');
            }
        } finally {
            setIsRequesting(false);
        }
    };

    // Auto-request permissions on mount
    useEffect(() => {
        requestPermissions();
    }, []);

    const StatusIcon = ({ status }: { status: 'pending' | 'granted' | 'denied' }) => {
        switch (status) {
            case 'pending':
                return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
            case 'granted':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'denied':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Camera className="w-5 h-5" />
                    <span>Media Permissions Required</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    To start streaming, we need access to your camera and microphone.
                </p>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <Camera className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium">Camera Access</span>
                        </div>
                        <StatusIcon status={cameraStatus} />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <Mic className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium">Microphone Access</span>
                        </div>
                        <StatusIcon status={micStatus} />
                    </div>
                </div>

                {(cameraStatus === 'denied' || micStatus === 'denied') && (
                    <div className="mt-4">
                        <Button
                            onClick={requestPermissions}
                            disabled={isRequesting}
                            className="w-full"
                        >
                            {isRequesting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Requesting Permissions...
                                </>
                            ) : (
                                'Try Again'
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}