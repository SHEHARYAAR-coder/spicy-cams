"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, X, Loader2, Upload, Camera, CheckCircle2, ArrowLeft, ArrowRight, Image as ImageIcon, Video } from "lucide-react";

// Constants for dropdown options
const HAIR_COLORS = [
    "Blonde",
    "Brunette",
    "Red",
    "Black",
    "Auburn",
    "Gray",
    "White",
    "Other",
];

const PHYSIQUES = [
    "Athletic",
    "Slim",
    "Average",
    "Curvy",
    "Petite",
    "Muscular",
    "BBW",
];

const BREAST_SIZES = ["A", "B", "C", "D", "DD", "DDD", "E", "F", "G+"];

const PUBIC_HAIR_OPTIONS = ["Shaved", "Trimmed", "Natural", "Landing Strip"];

const LANGUAGES = [
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Russian",
    "Chinese",
    "Japanese",
    "Korean",
    "Arabic",
    "Hindi",
    "Other",
];

const RELATIONSHIPS = ["Single", "Taken", "Married", "Open Relationship", "No"];

const ETHNICITIES = [
    "White",
    "Black",
    "Asian",
    "Latina",
    "Middle Eastern",
    "Mixed",
    "Other",
];

const PIERCINGS_OPTIONS = ["No", "Yes", "Multiple"];

const TATTOOS_OPTIONS = ["No", "Small", "Medium", "Large", "Full Body"];

const SHOW_CATEGORIES = [
    "Solo",
    "Couples",
    "Group",
    "Dancing",
    "Cosplay",
    "Fetish",
    "Roleplay",
    "Educational",
    "Gaming",
    "Chat",
    "Other",
];

interface ModelProfileFormProps {
    isOnboarding?: boolean;
    redirectPath?: string;
}

export default function ModelProfileForm({
    isOnboarding = false,
    redirectPath = "/profile"
}: ModelProfileFormProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // File upload refs
    const idFrontInputRef = useRef<HTMLInputElement>(null);
    const idBackInputRef = useRef<HTMLInputElement>(null);
    const facePhotoInputRef = useRef<HTMLInputElement>(null);
    const imageUploadRef = useRef<HTMLInputElement>(null);
    const videoUploadRef = useRef<HTMLInputElement>(null);

    // Step 1: Profile form state
    const [hairColor, setHairColor] = useState("");
    const [physique, setPhysique] = useState("");
    const [breastSize, setBreastSize] = useState("");
    const [pubicHair, setPubicHair] = useState("");
    const [displayedAge, setDisplayedAge] = useState("");
    const [spokenLanguages, setSpokenLanguages] = useState<string[]>([]);
    const [relationship, setRelationship] = useState("");
    const [ethnicity, setEthnicity] = useState("");
    const [piercings, setPiercings] = useState("");
    const [tattoos, setTattoos] = useState("");
    const [displayedCity, setDisplayedCity] = useState("");
    const [myShows, setMyShows] = useState<string[]>([]);
    const [profileDescription, setProfileDescription] = useState("");

    // Step 2: Verification state
    const [idFrontImage, setIdFrontImage] = useState<File | null>(null);
    const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
    const [idBackImage, setIdBackImage] = useState<File | null>(null);
    const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
    const [facePhoto, setFacePhoto] = useState<File | null>(null);
    const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(null);

    // Step 3: Media gallery state
    const [profileImages, setProfileImages] = useState<string[]>([]);
    const [profileVideos, setProfileVideos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");

    const handleToggleLanguage = (lang: string) => {
        setSpokenLanguages((prev) =>
            prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
        );
    };

    const handleToggleShowCategory = (category: string) => {
        setMyShows((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<File | null>>,
        previewSetter: React.Dispatch<React.SetStateAction<string | null>>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            setter(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                previewSetter(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNextStep = () => {
        setError(null);

        // Validate age on step 1
        if (currentStep === 1) {
            const age = parseInt(displayedAge);
            if (displayedAge && (isNaN(age) || age < 18)) {
                setError("Displayed age must be 18 or older");
                return;
            }

            // Validate description length
            if (profileDescription.length > 350) {
                setError("Profile description must be 350 characters or less");
                return;
            }

            setCurrentStep(2);
        } else if (currentStep === 2) {
            // Validate verification documents
            if (!idFrontImage || !idBackImage || !facePhoto) {
                setError("Please upload all required verification documents");
                return;
            }
            setCurrentStep(3);
        }
    };

    const handlePrevStep = () => {
        setError(null);
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Handle media file upload
    const handleMediaUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "image" | "video"
    ) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        console.log(`Starting upload of ${files.length} ${type}(s)`);

        setUploading(true);
        setUploadProgress(`Uploading ${type}...`);

        try {
            const uploadedUrls: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log(`Uploading ${type}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

                const formData = new FormData();
                formData.append("file", file);
                formData.append("type", type);

                const response = await fetch("/api/profile/upload-media", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Upload failed for ${file.name}:`, errorText);
                    throw new Error(`Failed to upload ${file.name}: ${errorText}`);
                }

                const data = await response.json();
                console.log(`Upload successful: ${data.url}`);
                uploadedUrls.push(data.url);
                setUploadProgress(
                    `Uploaded ${i + 1} of ${files.length} ${type}(s)...`
                );
            }

            // Update the arrays
            if (type === "image") {
                const newImages = [...profileImages, ...uploadedUrls];
                console.log("Updated profile images:", newImages);
                setProfileImages(newImages);
            } else {
                const newVideos = [...profileVideos, ...uploadedUrls];
                console.log("Updated profile videos:", newVideos);
                setProfileVideos(newVideos);
            }

            setUploadProgress("Upload complete!");
            setTimeout(() => setUploadProgress(""), 2000);
        } catch (error) {
            console.error("Upload error:", error);
            setError(`Failed to upload ${type}. Please try again.`);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleRemoveMedia = (url: string, type: "image" | "video") => {
        if (type === "image") {
            setProfileImages(profileImages.filter((img) => img !== url));
        } else {
            setProfileVideos(profileVideos.filter((vid) => vid !== url));
        }
    };

    const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement> | React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate verification documents
        if (!idFrontImage || !idBackImage || !facePhoto) {
            setError("Please upload all required verification documents");
            setLoading(false);
            return;
        }

        try {
            // Upload verification images first
            const formData = new FormData();
            formData.append("idFront", idFrontImage);
            formData.append("idBack", idBackImage);
            formData.append("facePhoto", facePhoto);

            const uploadResponse = await fetch("/api/verification/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload verification documents");
            }

            const { idFrontUrl, idBackUrl, facePhotoUrl } = await uploadResponse.json();

            // Submit profile data with verification URLs and media
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    // Model profile fields
                    hairColor: hairColor || null,
                    physique: physique || null,
                    breastSize: breastSize || null,
                    pubicHair: pubicHair || null,
                    displayedAge: displayedAge ? parseInt(displayedAge) : null,
                    spokenLanguages,
                    relationship: relationship || null,
                    ethnicity: ethnicity || null,
                    piercings: piercings || null,
                    tattoos: tattoos || null,
                    displayedCity: displayedCity || null,
                    myShows,
                    profileDescription: profileDescription || null,
                    // Verification documents
                    idFrontUrl,
                    idBackUrl,
                    facePhotoUrl,
                    verificationStatus: "pending",
                    profileCompleted: true, // Mark profile as completed
                    // Media gallery
                    profileImages,
                    profileVideos,
                    // Upgrade to model
                    targetRole: "MODEL",
                    isModel: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || "Failed to complete profile setup");
            }

            setSuccess(true);

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push(redirectPath);
            }, 2000);
        } catch (err) {
            console.error("Error setting up model profile:", err);
            setError(err instanceof Error ? err.message : "Failed to complete profile setup");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader className="text-center border-b border-gray-700">
                        <div className="flex justify-center mb-4">
                            <Crown className="w-12 h-12 text-purple-500" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-white">
                            {isOnboarding ? "Complete Your Model Profile" : "Upgrade to Model Account"}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            {currentStep === 1
                                ? (isOnboarding
                                    ? "Step 1 of 3: Tell us about yourself"
                                    : "Fill out your model profile to unlock premium features")
                                : currentStep === 2
                                    ? "Step 2 of 3: Verify your identity"
                                    : "Step 3 of 3: Upload profile media"
                            }
                        </CardDescription>

                        {/* Progress Indicator */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${currentStep === 1
                                ? 'border-purple-500 bg-purple-500 text-white'
                                : 'border-green-500 bg-green-500 text-white'
                                }`}>
                                {currentStep === 1 ? '1' : <CheckCircle2 className="w-6 h-6" />}
                            </div>
                            <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-purple-500' : 'bg-gray-600'}`} />
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${currentStep === 2
                                ? 'border-purple-500 bg-purple-500 text-white'
                                : currentStep > 2
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : 'border-gray-600 bg-gray-700 text-gray-400'
                                }`}>
                                {currentStep === 2 ? '2' : currentStep > 2 ? <CheckCircle2 className="w-6 h-6" /> : '2'}
                            </div>
                            <div className={`w-16 h-1 ${currentStep === 3 ? 'bg-purple-500' : 'bg-gray-600'}`} />
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${currentStep === 3
                                ? 'border-purple-500 bg-purple-500 text-white'
                                : 'border-gray-600 bg-gray-700 text-gray-400'
                                }`}>
                                3
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        {success && (
                            <Alert className="mb-6 bg-green-900/40 border-green-700">
                                <AlertDescription className="text-green-300">
                                    ✓ Profile setup complete! Redirecting...
                                </AlertDescription>
                            </Alert>
                        )}

                        {error && (
                            <Alert className="mb-6 bg-red-900/40 border-red-700">
                                <AlertDescription className="text-red-300">{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                            {currentStep === 1 ? (
                                // Step 1: Profile Information
                                <>
                                    {/* Hair Color */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Hair Color
                                        </label>
                                        <Select value={hairColor} onValueChange={setHairColor}>
                                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                                <SelectValue placeholder="Select hair color" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-700 border-gray-600">
                                                {HAIR_COLORS.map((color) => (
                                                    <SelectItem key={color} value={color} className="text-white">
                                                        {color}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Physique */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Physique
                                        </label>
                                        <Select value={physique} onValueChange={setPhysique}>
                                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                                <SelectValue placeholder="Select physique" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-700 border-gray-600">
                                                {PHYSIQUES.map((type) => (
                                                    <SelectItem key={type} value={type} className="text-white">
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Breast Size */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Breast Size
                                        </label>
                                        <Select value={breastSize} onValueChange={setBreastSize}>
                                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                                <SelectValue placeholder="Select breast size" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-700 border-gray-600">
                                                {BREAST_SIZES.map((size) => (
                                                    <SelectItem key={size} value={size} className="text-white">
                                                        {size}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Pubic Hair */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Pubic Hair
                                        </label>
                                        <Select value={pubicHair} onValueChange={setPubicHair}>
                                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                                <SelectValue placeholder="Select option" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-700 border-gray-600">
                                                {PUBIC_HAIR_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option} className="text-white">
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Displayed Age */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Displayed Age (18+)
                                        </label>
                                        <Input
                                            type="number"
                                            min="18"
                                            value={displayedAge}
                                            onChange={(e) => setDisplayedAge(e.target.value)}
                                            placeholder="Enter your age"
                                            className="bg-gray-700 border-gray-600 text-white"
                                        />
                                    </div>

                                    {/* Spoken Languages */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Spoken Languages
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {LANGUAGES.map((lang) => (
                                                <Button
                                                    key={lang}
                                                    type="button"
                                                    variant={spokenLanguages.includes(lang) ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleToggleLanguage(lang)}
                                                    className={
                                                        spokenLanguages.includes(lang)
                                                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                                                            : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                                                    }
                                                >
                                                    {lang}
                                                    {spokenLanguages.includes(lang) && (
                                                        <X className="ml-1 w-3 h-3" />
                                                    )}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Relationship */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Relationship Status
                                        </label>
                                        <Select value={relationship} onValueChange={setRelationship}>
                                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                                <SelectValue placeholder="Select relationship status" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-700 border-gray-600">
                                                {RELATIONSHIPS.map((status) => (
                                                    <SelectItem key={status} value={status} className="text-white">
                                                        {status}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Ethnicity */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Ethnicity
                                        </label>
                                        <Select value={ethnicity} onValueChange={setEthnicity}>
                                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                                <SelectValue placeholder="Select ethnicity" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-700 border-gray-600">
                                                {ETHNICITIES.map((eth) => (
                                                    <SelectItem key={eth} value={eth} className="text-white">
                                                        {eth}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Piercings */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Piercings
                                        </label>
                                        <Select value={piercings} onValueChange={setPiercings}>
                                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                                <SelectValue placeholder="Select option" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-700 border-gray-600">
                                                {PIERCINGS_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option} className="text-white">
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Tattoos */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Tattoos
                                        </label>
                                        <Select value={tattoos} onValueChange={setTattoos}>
                                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                                <SelectValue placeholder="Select option" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-700 border-gray-600">
                                                {TATTOOS_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option} className="text-white">
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Displayed City */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            City/Location
                                        </label>
                                        <Input
                                            type="text"
                                            value={displayedCity}
                                            onChange={(e) => setDisplayedCity(e.target.value)}
                                            placeholder="Enter your city"
                                            className="bg-gray-700 border-gray-600 text-white"
                                        />
                                    </div>

                                    {/* My Shows */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Show Categories
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {SHOW_CATEGORIES.map((category) => (
                                                <Button
                                                    key={category}
                                                    type="button"
                                                    variant={myShows.includes(category) ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleToggleShowCategory(category)}
                                                    className={
                                                        myShows.includes(category)
                                                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                                                            : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                                                    }
                                                >
                                                    {category}
                                                    {myShows.includes(category) && (
                                                        <X className="ml-1 w-3 h-3" />
                                                    )}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Profile Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Profile Description
                                            <span className="text-gray-500 ml-2 text-xs">
                                                ({profileDescription.length}/350)
                                            </span>
                                        </label>
                                        <Textarea
                                            value={profileDescription}
                                            onChange={(e) => setProfileDescription(e.target.value)}
                                            placeholder="Tell viewers about yourself..."
                                            maxLength={350}
                                            rows={4}
                                            className="bg-gray-700 border-gray-600 text-white resize-none"
                                        />
                                    </div>

                                    {/* Next Button */}
                                    <Button
                                        type="button"
                                        onClick={handleNextStep}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
                                    >
                                        Continue to Verification
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </>
                            ) : currentStep === 2 ? (
                                // Step 2: Verification Documents
                                <>
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <h3 className="text-xl font-semibold text-white mb-2">Identity Verification</h3>
                                            <p className="text-gray-400 text-sm">
                                                Upload clear photos of your ID and a live selfie to verify your identity
                                            </p>
                                        </div>

                                        {/* ID Front */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                ID Card - Front Side <span className="text-red-400">*</span>
                                            </label>
                                            <div
                                                onClick={() => idFrontInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
                                            >
                                                {idFrontPreview ? (
                                                    <div className="relative">
                                                        <div className="relative w-full h-48 mx-auto">
                                                            <Image
                                                                src={idFrontPreview}
                                                                alt="ID Front"
                                                                fill
                                                                className="object-contain rounded"
                                                            />
                                                        </div>
                                                        <div className="mt-2 text-green-400 flex items-center justify-center gap-2">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            <span>Uploaded successfully</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400">
                                                        <Upload className="w-12 h-12 mx-auto mb-2" />
                                                        <p>Click to upload ID front</p>
                                                        <p className="text-xs mt-1">PNG, JPG up to 10MB</p>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                ref={idFrontInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, setIdFrontImage, setIdFrontPreview)}
                                                className="hidden"
                                            />
                                        </div>

                                        {/* ID Back */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                ID Card - Back Side <span className="text-red-400">*</span>
                                            </label>
                                            <div
                                                onClick={() => idBackInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
                                            >
                                                {idBackPreview ? (
                                                    <div className="relative">
                                                        <div className="relative w-full h-48 mx-auto">
                                                            <Image
                                                                src={idBackPreview}
                                                                alt="ID Back"
                                                                fill
                                                                className="object-contain rounded"
                                                            />
                                                        </div>
                                                        <div className="mt-2 text-green-400 flex items-center justify-center gap-2">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            <span>Uploaded successfully</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400">
                                                        <Upload className="w-12 h-12 mx-auto mb-2" />
                                                        <p>Click to upload ID back</p>
                                                        <p className="text-xs mt-1">PNG, JPG up to 10MB</p>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                ref={idBackInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, setIdBackImage, setIdBackPreview)}
                                                className="hidden"
                                            />
                                        </div>

                                        {/* Live Face Photo */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Live Face Photo <span className="text-red-400">*</span>
                                            </label>
                                            <div
                                                onClick={() => facePhotoInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
                                            >
                                                {facePhotoPreview ? (
                                                    <div className="relative">
                                                        <div className="relative w-full h-48 mx-auto">
                                                            <Image
                                                                src={facePhotoPreview}
                                                                alt="Face Photo"
                                                                fill
                                                                className="object-contain rounded"
                                                            />
                                                        </div>
                                                        <div className="mt-2 text-green-400 flex items-center justify-center gap-2">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            <span>Uploaded successfully</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400">
                                                        <Camera className="w-12 h-12 mx-auto mb-2" />
                                                        <p>Click to upload face photo</p>
                                                        <p className="text-xs mt-1">Take a clear selfie showing your face</p>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                ref={facePhotoInputRef}
                                                type="file"
                                                accept="image/*"
                                                capture="user"
                                                onChange={(e) => handleFileChange(e, setFacePhoto, setFacePhotoPreview)}
                                                className="hidden"
                                            />
                                        </div>

                                        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mt-4">
                                            <p className="text-blue-300 text-sm">
                                                <strong>Note:</strong> Your documents will be securely stored and used only for verification purposes.
                                                This helps us maintain a safe and trusted community.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex gap-4">
                                        <Button
                                            type="button"
                                            onClick={handlePrevStep}
                                            variant="outline"
                                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600 py-6 text-lg"
                                        >
                                            <ArrowLeft className="mr-2 w-5 h-5" />
                                            Back
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleNextStep}
                                            disabled={!idFrontImage || !idBackImage || !facePhoto}
                                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg disabled:opacity-50"
                                        >
                                            Continue to Media Upload
                                            <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                // Step 3: Media Gallery Upload
                                <>
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <h3 className="text-xl font-semibold text-white mb-2">Profile Media Gallery</h3>
                                            <p className="text-gray-400 text-sm">
                                                Upload images and videos to showcase on your public profile (Optional)
                                            </p>
                                        </div>

                                        {/* Upload Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Image Upload */}
                                            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
                                                <input
                                                    ref={imageUploadRef}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={(e) => handleMediaUpload(e, "image")}
                                                    className="hidden"
                                                    disabled={uploading}
                                                />
                                                <div
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        imageUploadRef.current?.click();
                                                    }}
                                                    className="cursor-pointer flex flex-col items-center gap-2"
                                                >
                                                    <ImageIcon className="w-12 h-12 text-gray-400" />
                                                    <p className="text-sm text-gray-400">
                                                        Click to upload images
                                                    </p>
                                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                                </div>
                                            </div>

                                            {/* Video Upload */}
                                            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
                                                <input
                                                    ref={videoUploadRef}
                                                    type="file"
                                                    accept="video/*"
                                                    multiple
                                                    onChange={(e) => handleMediaUpload(e, "video")}
                                                    className="hidden"
                                                    disabled={uploading}
                                                />
                                                <div
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        videoUploadRef.current?.click();
                                                    }}
                                                    className="cursor-pointer flex flex-col items-center gap-2"
                                                >
                                                    <Video className="w-12 h-12 text-gray-400" />
                                                    <p className="text-sm text-gray-400">
                                                        Click to upload videos
                                                    </p>
                                                    <p className="text-xs text-gray-500">MP4, WebM up to 50MB</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Upload Progress */}
                                        {uploadProgress && (
                                            <div className="text-center text-sm text-purple-400">
                                                {uploadProgress}
                                            </div>
                                        )}

                                        {/* Images Gallery */}
                                        {profileImages.length > 0 && (
                                            <div>
                                                <h4 className="text-lg font-semibold text-white mb-3">
                                                    Images ({profileImages.length})
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {profileImages.map((url, index) => (
                                                        <div key={index} className="relative group h-40">
                                                            <Image
                                                                src={url}
                                                                alt={`Gallery image ${index + 1}`}
                                                                fill
                                                                className="object-cover rounded-lg"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveMedia(url, "image")}
                                                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Remove image"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Videos Gallery */}
                                        {profileVideos.length > 0 && (
                                            <div>
                                                <h4 className="text-lg font-semibold text-white mb-3">
                                                    Videos ({profileVideos.length})
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {profileVideos.map((url, index) => (
                                                        <div key={index} className="relative group">
                                                            <video
                                                                src={url}
                                                                className="w-full h-60 object-cover rounded-lg"
                                                                controls
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveMedia(url, "video")}
                                                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Remove video"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {profileImages.length === 0 && profileVideos.length === 0 && !uploading && (
                                            <div className="text-center py-8 text-gray-500">
                                                No media uploaded yet. Upload images and videos to showcase on your profile.
                                            </div>
                                        )}

                                        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mt-4">
                                            <p className="text-blue-300 text-sm">
                                                <strong>Note:</strong> You can skip this step and add media later from your profile page.
                                                These images and videos will be visible on your public profile.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex gap-4">
                                        <Button
                                            type="button"
                                            onClick={handlePrevStep}
                                            variant="outline"
                                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600 py-6 text-lg"
                                        >
                                            <ArrowLeft className="mr-2 w-5 h-5" />
                                            Back
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={loading || success}
                                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Completing Profile...
                                                </>
                                            ) : success ? (
                                                "Profile Complete!"
                                            ) : (
                                                "Complete Profile"
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
