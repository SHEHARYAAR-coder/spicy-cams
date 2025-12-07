"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
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
import { Crown, X, Loader2 } from "lucide-react";

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

export default function UpgradePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate age
    const age = parseInt(displayedAge);
    if (displayedAge && (isNaN(age) || age < 18)) {
      setError("Displayed age must be 18 or older");
      setLoading(false);
      return;
    }

    // Validate description length
    if (profileDescription.length > 350) {
      setError("Profile description must be 350 characters or less");
      setLoading(false);
      return;
    }

    try {
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
          // model
          targetRole: "MODEL",
          isModel: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to upgrade to model");
      }

      setSuccess(true);
      
      // Redirect to profile after 2 seconds
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (err) {
      console.error("Error upgrading to model:", err);
      setError(err instanceof Error ? err.message : "Failed to upgrade account");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/40 backdrop-blur-sm border-gray-700/50">
          <CardContent className="pt-6">
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertDescription className="text-yellow-200">
                Please log in to upgrade your account to model.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/40 backdrop-blur-sm border-gray-700/50">
          <CardContent className="pt-6">
            <Alert className="border-green-500/50 bg-green-500/10">
              <AlertDescription className="text-green-200 text-center">
                <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                <p className="text-xl font-semibold mb-2">Welcome to Model!</p>
                <p>Your account has been upgraded successfully. Redirecting to your profile...</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-10 h-10 text-yellow-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Upgrade to Model
            </h1>
          </div>
          <p className="text-lg text-gray-400">
            Fill out your model profile and start streaming
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-xl bg-gray-800/40 backdrop-blur-sm border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
                Model Profile Information
              </CardTitle>
              <CardDescription className="text-gray-400">
                Complete your profile to become a creator. All fields are optional but help viewers discover you.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Grid layout for form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hair Color */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Hair Color
                  </label>
                  <Select value={hairColor} onValueChange={setHairColor}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select hair color" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {HAIR_COLORS.map((color) => (
                        <SelectItem
                          key={color}
                          value={color}
                          className="text-white hover:bg-gray-700"
                        >
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Physique */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Physique
                  </label>
                  <Select value={physique} onValueChange={setPhysique}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select physique" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {PHYSIQUES.map((type) => (
                        <SelectItem
                          key={type}
                          value={type}
                          className="text-white hover:bg-gray-700"
                        >
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Breast Size */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Breast Size
                  </label>
                  <Select value={breastSize} onValueChange={setBreastSize}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {BREAST_SIZES.map((size) => (
                        <SelectItem
                          key={size}
                          value={size}
                          className="text-white hover:bg-gray-700"
                        >
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pubic Hair */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Pubic Hair
                  </label>
                  <Select value={pubicHair} onValueChange={setPubicHair}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {PUBIC_HAIR_OPTIONS.map((option) => (
                        <SelectItem
                          key={option}
                          value={option}
                          className="text-white hover:bg-gray-700"
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Displayed Age */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Displayed Age (18+)
                  </label>
                  <Input
                    type="number"
                    min="18"
                    max="99"
                    value={displayedAge}
                    onChange={(e) => setDisplayedAge(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter age"
                  />
                </div>

                {/* Relationship */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Relationship Status
                  </label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {RELATIONSHIPS.map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                          className="text-white hover:bg-gray-700"
                        >
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ethnicity */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Ethnicity
                  </label>
                  <Select value={ethnicity} onValueChange={setEthnicity}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select ethnicity" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {ETHNICITIES.map((eth) => (
                        <SelectItem
                          key={eth}
                          value={eth}
                          className="text-white hover:bg-gray-700"
                        >
                          {eth}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Piercings */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Piercings
                  </label>
                  <Select value={piercings} onValueChange={setPiercings}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {PIERCINGS_OPTIONS.map((option) => (
                        <SelectItem
                          key={option}
                          value={option}
                          className="text-white hover:bg-gray-700"
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tattoos */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Tattoos
                  </label>
                  <Select value={tattoos} onValueChange={setTattoos}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {TATTOOS_OPTIONS.map((option) => (
                        <SelectItem
                          key={option}
                          value={option}
                          className="text-white hover:bg-gray-700"
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Displayed City */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Displayed City
                  </label>
                  <Input
                    type="text"
                    value={displayedCity}
                    onChange={(e) => setDisplayedCity(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter city name"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Spoken Languages - Multi-select tags */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Spoken Languages
                </label>
                <div className="bg-gray-800 border border-gray-700 rounded-md p-3">
                  {spokenLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {spokenLanguages.map((lang) => (
                        <span
                          key={lang}
                          className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {lang}
                          <button
                            type="button"
                            onClick={() => handleToggleLanguage(lang)}
                            className="hover:bg-purple-700 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.filter((lang) => !spokenLanguages.includes(lang)).map(
                      (lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => handleToggleLanguage(lang)}
                          className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full text-sm transition-colors"
                        >
                          + {lang}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* My Shows - Multi-select checkboxes */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  My Shows
                </label>
                <div className="bg-gray-800 border border-gray-700 rounded-md p-3">
                  {myShows.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {myShows.map((show) => (
                        <span
                          key={show}
                          className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {show}
                          <button
                            type="button"
                            onClick={() => handleToggleShowCategory(show)}
                            className="hover:bg-purple-700 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {SHOW_CATEGORIES.filter((cat) => !myShows.includes(cat)).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleToggleShowCategory(cat)}
                          className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full text-sm transition-colors"
                        >
                          + {cat}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Description */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Profile Description
                </label>
                <Textarea
                  value={profileDescription}
                  onChange={(e) => setProfileDescription(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                  placeholder="Tell viewers about yourself... (350 character limit)"
                  maxLength={350}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {profileDescription.length}/350
                </p>
              </div>
            </CardContent>

            <div className="px-6 pb-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Upgrading to Model...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Model
                  </>
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
