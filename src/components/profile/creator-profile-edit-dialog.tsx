"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { X } from "lucide-react";

interface ProfileData {
  hairColor?: string | null;
  physique?: string | null;
  breastSize?: string | null;
  pubicHair?: string | null;
  displayedAge?: string | number | null;
  spokenLanguages?: string[];
  relationship?: string | null;
  ethnicity?: string | null;
  piercings?: string | null;
  tattoos?: string | null;
  displayedCity?: string | null;
  myShows?: string[];
  profileDescription?: string | null;
}

interface CreatorProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: ProfileData | null;
  onSave: (data: ProfileData) => Promise<void>;
}

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

export default function CreatorProfileEditDialog({
  open,
  onOpenChange,
  profileData,
  onSave,
}: CreatorProfileEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [hairColor, setHairColor] = useState(
    profileData?.hairColor || ""
  );
  const [physique, setPhysique] = useState(profileData?.physique || "");
  const [breastSize, setBreastSize] = useState(
    profileData?.breastSize || ""
  );
  const [pubicHair, setPubicHair] = useState(profileData?.pubicHair || "");
  const [displayedAge, setDisplayedAge] = useState(
    profileData?.displayedAge || ""
  );
  const [spokenLanguages, setSpokenLanguages] = useState<string[]>(
    profileData?.spokenLanguages || []
  );
  const [relationship, setRelationship] = useState(
    profileData?.relationship || ""
  );
  const [ethnicity, setEthnicity] = useState(profileData?.ethnicity || "");
  const [piercings, setPiercings] = useState(profileData?.piercings || "");
  const [tattoos, setTattoos] = useState(profileData?.tattoos || "");
  const [displayedCity, setDisplayedCity] = useState(
    profileData?.displayedCity || ""
  );
  const [myShows, setMyShows] = useState<string[]>(
    profileData?.myShows || []
  );
  const [profileDescription, setProfileDescription] = useState(
    profileData?.profileDescription || ""
  );

  // Update state when profileData changes
  React.useEffect(() => {
    if (profileData) {
      setHairColor(profileData.hairColor || "");
      setPhysique(profileData.physique || "");
      setBreastSize(profileData.breastSize || "");
      setPubicHair(profileData.pubicHair || "");
      setDisplayedAge(profileData.displayedAge || "");
      setSpokenLanguages(profileData.spokenLanguages || []);
      setRelationship(profileData.relationship || "");
      setEthnicity(profileData.ethnicity || "");
      setPiercings(profileData.piercings || "");
      setTattoos(profileData.tattoos || "");
      setDisplayedCity(profileData.displayedCity || "");
      setMyShows(profileData.myShows || []);
      setProfileDescription(profileData.profileDescription || "");
    }
  }, [profileData]);

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

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Validate age
    const age = parseInt(String(displayedAge));
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
      await onSave({
        hairColor: hairColor || null,
        physique: physique || null,
        breastSize: breastSize || null,
        pubicHair: pubicHair || null,
        displayedAge: displayedAge ? parseInt(String(displayedAge)) : null,
        spokenLanguages,
        relationship: relationship || null,
        ethnicity: ethnicity || null,
        piercings: piercings || null,
        tattoos: tattoos || null,
        displayedCity: displayedCity || null,
        myShows,
        profileDescription: profileDescription || null,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border border-purple-700 rounded-xl shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">
            Edit Creator Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
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
              <label className="text-sm text-gray-400 mb-2 block">Tattoos</label>
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
            <label className="text-sm text-gray-400 mb-2 block">My Shows</label>
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
        </div>

        <DialogFooter className="mt-6 flex gap-2 justify-end">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
