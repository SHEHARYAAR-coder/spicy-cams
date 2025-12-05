"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { Crown, X, Loader2, Upload, Camera, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";

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
        }
    };

    const handlePrevStep = () => {
        setError(null);
        setCurrentStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate verification documents on step 2
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

            // Note: You'll need to create this API endpoint
            const uploadResponse = await fetch("/api/verification/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload verification documents");
            }

            const { idFrontUrl, idBackUrl, facePhotoUrl } = await uploadResponse.json();

            // Submit profile data with verification URLs
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    // Creator profile fields
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
                    // Upgrade to creator
                    targetRole: "CREATOR",
                    isCreator: true,
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
                            {isOnboarding ? "Complete Your Model Profile" : "Upgrade to Creator Account"}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            {currentStep === 1
                                ? (isOnboarding
                                    ? "Step 1 of 2: Tell us about yourself"
                                    : "Fill out your creator profile to unlock premium features")
                                : "Step 2 of 2: Verify your identity"
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
                            <div className={`w-16 h-1 ${currentStep === 2 ? 'bg-purple-500' : 'bg-gray-600'}`} />
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${currentStep === 2
                                    ? 'border-purple-500 bg-purple-500 text-white'
                                    : 'border-gray-600 bg-gray-700 text-gray-400'
                                }`}>
                                2
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

                        <form onSubmit={handleSubmit} className="space-y-6">
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
                            ) : (
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
                                                        <img
                                                            src={idFrontPreview}
                                                            alt="ID Front"
                                                            className="max-h-48 mx-auto rounded"
                                                        />
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
                                                        <img
                                                            src={idBackPreview}
                                                            alt="ID Back"
                                                            className="max-h-48 mx-auto rounded"
                                                        />
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
                                                        <img
                                                            src={facePhotoPreview}
                                                            alt="Face Photo"
                                                            className="max-h-48 mx-auto rounded"
                                                        />
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
                                            type="submit"
                                            disabled={loading || success || !idFrontImage || !idBackImage || !facePhoto}
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
