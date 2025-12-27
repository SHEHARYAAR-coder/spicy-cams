"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye, UserCheck, Grid3x3 } from "lucide-react";
import { useCategoryType, CategoryType } from "@/contexts/CategoryContext";

interface CategoryData {
  name: string;
  count: number;
  hot?: boolean;
  new?: boolean;
}

export default function CategoryTagsPage() {
  const params = useParams();
  const router = useRouter();
  const category = params?.category as string;
  const { setSelectedCategoryType } = useCategoryType();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("Main");

  useEffect(() => {
    if (category && ["girls", "couples", "guys", "trans"].includes(category)) {
      setSelectedCategoryType(category as CategoryType);
    }
  }, [category, setSelectedCategoryType]);

  const alphabet = ["Main", "#", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

  const getCategoryTitle = () => {
    const titles: Record<string, string> = {
      trans: "Trans on Live Sex Chat",
      girls: "Cam Girls on Live Sex Chat",
      couples: "Couples in Free Live Sex",
      guys: "Naked Men on Live Sex Chat",
    };
    return titles[category] || category;
  };

  // GIRLS DATA - Complete from reference
  const girlsData = {
    appearance: {
      age: [
        { name: "Teen 18+", count: 1618 },
        { name: "Young 22+", count: 4023 },
        { name: "MILF", count: 1414 },
        { name: "Mature", count: 268 },
        { name: "Granny", count: 45 },
      ],
      ethnicity: [
        { name: "Arab", count: 168 },
        { name: "Asian", count: 595 },
        { name: "Ebony", count: 499 },
        { name: "Indian", count: 348 },
        { name: "Latina", count: 3460 },
        { name: "Mixed", count: 200 },
        { name: "White", count: 2311 },
      ],
      bodyType: [
        { name: "Skinny", count: 2816 },
        { name: "Athletic", count: 657 },
        { name: "Medium", count: 2370 },
        { name: "Curvy", count: 1625 },
        { name: "BBW", count: 390 },
      ],
      hair: [
        { name: "Blonde", count: 1333 },
        { name: "Black", count: 2317 },
        { name: "Brunette", count: 2545 },
        { name: "Redhead", count: 624 },
        { name: "Colorful", count: 324 },
      ],
      bodyTraits: [
        { name: "Bald", count: 13 },
        { name: "Big Ass", count: 4803 },
        { name: "Big Clit", count: 1777 },
        { name: "Big Nipples", count: 2304 },
        { name: "Big Tits", count: 3347 },
        { name: "Hairy armpits", count: 506 },
        { name: "Hairy Pussy", count: 1225 },
        { name: "Shaven", count: 4381 },
        { name: "Small Tits", count: 2631 },
        { name: "Trimmed", count: 2074 },
      ],
    },
    activitiesOnRequest: {
      privateShow: [
        { name: "8-12 tk", count: 3613 },
        { name: "16-24 tk", count: 2252 },
        { name: "32-60 tk", count: 1485 },
        { name: "90+ tk", count: 405 },
        { name: "Video Call (Cam2Cam)", count: 7322 },
        { name: "Recordable Privates", count: 5652 },
        { name: "Spy on Shows", count: 412 },
      ],
      activities: [
        { name: "69 Position", count: 1109 },
        { name: "Ahegao", count: 4837 },
        { name: "Anal", count: 2892, hot: true },
        { name: "Anal Toys", count: 2493 },
        { name: "Ass to Mouth", count: 1277 },
        { name: "Blowjob", count: 5662, hot: true },
        { name: "Bukkake", count: 125, new: true },
        { name: "Camel Toe", count: 4302 },
        { name: "Cock Rating", count: 3038 },
        { name: "Cosplay", count: 1218, hot: true },
        { name: "Cowgirl", count: 4255 },
        { name: "Creampie", count: 1945 },
        { name: "Cumshot", count: 906 },
        { name: "Deepthroat", count: 4714, hot: true },
        { name: "Dildo or Vibrator", count: 5611 },
        { name: "Dirty Talk", count: 5292 },
        { name: "Doggy Style", count: 6391, hot: true },
        { name: "Double Penetration", count: 1642 },
        { name: "Erotic Dance", count: 6261 },
        { name: "Facesitting", count: 1730 },
        { name: "Facial", count: 1961 },
        { name: "Fingering", count: 6345, hot: true },
        { name: "Fisting", count: 810 },
        { name: "Flashing", count: 3110 },
        { name: "Footjob", count: 1208, new: true },
        { name: "Foursome", count: 28, new: true },
        { name: "Fuck Machine", count: 847, hot: true },
        { name: "Gagging", count: 2055 },
        { name: "Gangbang", count: 35 },
        { name: "Gape", count: 625 },
        { name: "Glory Hole", count: 103, new: true },
        { name: "Handjob", count: 3257 },
        { name: "Hardcore", count: 268 },
        { name: "Humiliation", count: 3399 },
        { name: "Jerk-off Instruction", count: 3078 },
        { name: "Massage", count: 1175 },
        { name: "Masturbation", count: 6234 },
        { name: "Nipple Toys", count: 2560 },
        { name: "Oil Show", count: 5513 },
        { name: "Orgasm", count: 4991 },
        { name: "Pegging", count: 351 },
        { name: "Pussy Licking", count: 499 },
        { name: "Role Play", count: 3753 },
        { name: "Sex Toys", count: 5289 },
        { name: "Sexting", count: 5292 },
        { name: "Shower", count: 1799 },
        { name: "Spanking", count: 6121 },
        { name: "Squirt", count: 3501 },
        { name: "Strapon", count: 551 },
        { name: "Swing", count: 240 },
        { name: "Threesome", count: 47, new: true },
        { name: "Tittyfuck", count: 4600 },
        { name: "Topless", count: 5257 },
        { name: "Twerk", count: 4873 },
        { name: "Upskirt", count: 2598 },
        { name: "Yoga", count: 1635 },
      ],
      device: [
        { name: "Anal Toys", count: 2493 },
        { name: "Dildo or Vibrator", count: 5611 },
        { name: "Fuck Machine", count: 847, hot: true },
        { name: "Interactive Toy", count: 4663, hot: true },
        { name: "Kiiroo", count: 4 },
        { name: "Lovense", count: 4661 },
        { name: "Nipple Toys", count: 2560 },
        { name: "Sex Toys", count: 5289 },
        { name: "Strapon", count: 551 },
      ],
    },
    specifics: {
      subcultures: [
        { name: "Anime Girls", count: 282, new: true },
        { name: "Club Girls", count: 187, new: true },
        { name: "E-girl", count: 168, new: true },
        { name: "Emo", count: 245 },
        { name: "Gamers", count: 191, new: true },
        { name: "Glamour", count: 1043 },
        { name: "Goth", count: 378 },
        { name: "Gym Babe", count: 418, new: true },
        { name: "Housewives", count: 941 },
        { name: "K-pop", count: 125, new: true },
        { name: "Nerds", count: 141, new: true },
        { name: "Punks", count: 65, new: true },
        { name: "Queers", count: 60 },
        { name: "Romantic", count: 1127 },
        { name: "Student", count: 2726 },
        { name: "Tomboys", count: 153 },
      ],
      broadcast: [
        { name: "HD", count: 7134 },
        { name: "Mobile", count: 1386 },
        { name: "Recordable", count: 5941 },
        { name: "VR Cams", count: 179 },
      ],
      showType: [
        { name: "XXXmas", count: 541 },
        { name: "ASMR", count: 184 },
        { name: "Cooking", count: 1005 },
        { name: "Flirting", count: 33 },
        { name: "Group Sex", count: 115 },
        { name: "Interracial", count: 4 },
        { name: "New Models", count: 1056 },
        { name: "Office", count: 1228 },
        { name: "Old & Young 22+", count: 41 },
        { name: "Outdoor", count: 1159 },
        { name: "Pornstars", count: 2 },
        { name: "POV", count: 1428 },
        { name: "Ticket & Group Shows", count: 156 },
        { name: "Video Games", count: 99, hot: true },
        { name: "VTubers", count: 1, new: true },
      ],
      genderIdentity: [
        { name: "Non-binary", count: 46 },
      ],
      orientation: [
        { name: "Bisexual", count: 6200 },
        { name: "Lesbian", count: 188 },
        { name: "Straight", count: 1460 },
      ],
    },
    countriesLanguages: {
      northAmerica: [
        { name: "American", count: 91 },
        { name: "Canadian", count: 7 },
        { name: "Mexican", count: 5 },
      ],
      southAmerica: [
        { name: "Argentinian", count: 14 },
        { name: "Brazilian", count: 36 },
        { name: "Chilean", count: 2 },
        { name: "Colombian", count: 3807 },
        { name: "Ecuadorian", count: 3 },
        { name: "Peruvian", count: 5 },
        { name: "Uruguayan", count: 0 },
        { name: "Venezuelan", count: 134 },
      ],
      europe: [
        { name: "Austrian", count: 7, new: true },
        { name: "Belgian", count: 1 },
        { name: "Bulgarian", count: 0 },
        { name: "Croatian", count: 0 },
        { name: "Czech", count: 1 },
        { name: "Danish", count: 0 },
        { name: "Dutch", count: 5 },
        { name: "Estonian", count: 0 },
        { name: "Finnish", count: 1 },
        { name: "French", count: 46 },
        { name: "Georgian", count: 0 },
        { name: "German", count: 53 },
        { name: "Greek", count: 0 },
        { name: "Hungarian", count: 7 },
        { name: "Irish", count: 1 },
        { name: "Italian", count: 41 },
        { name: "Latvian", count: 1 },
        { name: "Lithuanian", count: 0 },
        { name: "Nordic", count: 2 },
        { name: "Norwegian", count: 1 },
        { name: "Polish", count: 3 },
        { name: "Portuguese", count: 4 },
        { name: "Romanian", count: 82 },
        { name: "Serbian", count: 2 },
        { name: "Slovakian", count: 0 },
        { name: "Slovenian", count: 0 },
        { name: "Spanish", count: 19 },
        { name: "Swedish", count: 1 },
        { name: "Swiss", count: 4 },
        { name: "UK Models", count: 37 },
        { name: "Ukrainian", count: 133 },
      ],
      asiaPacific: [
        { name: "Australian", count: 3 },
        { name: "Chinese", count: 275 },
        { name: "Indian", count: 348 },
        { name: "Japanese", count: 87 },
        { name: "Korean", count: 3 },
        { name: "Malaysian", count: 1 },
        { name: "Sri Lankan", count: 11 },
        { name: "Thai", count: 4 },
        { name: "Vietnamese", count: 188 },
      ],
      africa: [
        { name: "African", count: 169 },
        { name: "Kenyan", count: 47 },
        { name: "Malagasy", count: 1 },
        { name: "Nigerian", count: 0 },
        { name: "South African", count: 96 },
        { name: "Ugandan", count: 1 },
        { name: "Zimbabwean", count: 18 },
      ],
      middleEast: [
        { name: "Arab", count: 168 },
        { name: "Israeli", count: 0 },
        { name: "Turkish", count: 17 },
      ],
      languages: [
        { name: "Portuguese Speaking", count: 40 },
        { name: "Russian Speaking", count: 516 },
        { name: "Spanish Speaking", count: 3992 },
      ],
    },
    fetishesKinks: [
      { name: "BDSM", count: 84 },
      { name: "Cock Rating", count: 3038 },
      { name: "Corset", count: 1012 },
      { name: "Cuckold", count: 882 },
      { name: "Foot Fetish", count: 5127, hot: true },
      { name: "Heels", count: 4416 },
      { name: "Jeans", count: 260, new: true },
      { name: "Latex", count: 1097 },
      { name: "Leather", count: 1272 },
      { name: "Mistress", count: 1385 },
      { name: "Nylon", count: 1956 },
      { name: "Piercing", count: 638 },
      { name: "Pregnant", count: 43 },
      { name: "Smoking", count: 2238 },
      { name: "Sport Gear", count: 357, new: true },
      { name: "Tattoos", count: 1033 },
    ],
  };

  // Filter function
  const filterByLetter = (items: CategoryData[]) => {
    let filtered = items;
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedLetter !== "Main") {
      if (selectedLetter === "#") {
        filtered = filtered.filter(item => /^[0-9]/.test(item.name));
      } else {
        filtered = filtered.filter(item => 
          item.name.toUpperCase().startsWith(selectedLetter)
        );
      }
    }
    
    return filtered;
  };

  const CategoryItem = ({ item }: { item: CategoryData }) => (
    <button
      onClick={() => router.push(`/?category=${encodeURIComponent(item.name)}`)}
      className="flex items-center gap-2 hover:text-purple-400 transition-colors text-left py-1"
    >
      <span className="text-white font-medium">{item.name}</span>
      {item.hot && (
        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] px-1.5 py-0 border-0">
          HOT
        </Badge>
      )}
      {item.new && (
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] px-1.5 py-0 border-0">
          NEW
        </Badge>
      )}
      <span className="text-gray-500">{item.count}</span>
    </button>
  );

  const renderSection = (title: string, items: CategoryData[]) => {
    const filtered = filterByLetter(items);
    if (filtered.length === 0) return null;
    
    return (
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-800">
          {title}
        </h3>
        <div className="space-y-2">
          {filtered.map((item, idx) => (
            <CategoryItem key={idx} item={item} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">
            All Categories - {getCategoryTitle()}
          </h1>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Find categories"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800/60 border-gray-700 text-white rounded-full"
            />
          </div>
        </div>

        {/* Alphabet Navigation */}
        <div className="mb-10 pb-4 border-b border-gray-800">
          <div className="flex flex-wrap gap-3">
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`text-sm font-medium transition-colors relative pb-1 ${
                  selectedLetter === letter ? "text-purple-500" : "text-gray-400 hover:text-white"
                }`}
              >
                {letter}
                {selectedLetter === letter && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Appearance Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Eye className="w-6 h-6" />
            Appearance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {renderSection("Age", girlsData.appearance.age)}
            {renderSection("Ethnicity", girlsData.appearance.ethnicity)}
            {renderSection("Body Type", girlsData.appearance.bodyType)}
            {renderSection("Hair", girlsData.appearance.hair)}
            {renderSection("Body Traits", girlsData.appearance.bodyTraits)}
          </div>
        </section>

        {/* Activities on Request */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <UserCheck className="w-6 h-6" />
            Activities on Request
          </h2>
          <div className="space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {renderSection("Private Show", girlsData.activitiesOnRequest.privateShow)}
              <div className="lg:col-span-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-800">
                  Activities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8">
                  {[0, 1, 2, 3].map((colIdx) => {
                    const filtered = filterByLetter(girlsData.activitiesOnRequest.activities);
                    return (
                      <div key={colIdx} className="space-y-2">
                        {filtered
                          .filter((_, idx) => idx % 4 === colIdx)
                          .map((item, idx) => (
                            <CategoryItem key={idx} item={item} />
                          ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              {renderSection("Device", girlsData.activitiesOnRequest.device)}
            </div>
          </div>
        </section>

        {/* Specifics */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Grid3x3 className="w-6 h-6" />
            Specifics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {renderSection("Subcultures", girlsData.specifics.subcultures)}
            {renderSection("Broadcast", girlsData.specifics.broadcast)}
            {renderSection("Show Type", girlsData.specifics.showType)}
            {renderSection("Gender Identity", girlsData.specifics.genderIdentity)}
            {renderSection("Orientation", girlsData.specifics.orientation)}
          </div>
        </section>

        {/* Countries & Languages */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            🌍 Countries & Languages
          </h2>
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {renderSection("North America", girlsData.countriesLanguages.northAmerica)}
              {renderSection("South America", girlsData.countriesLanguages.southAmerica)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {renderSection("Europe", girlsData.countriesLanguages.europe)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {renderSection("Asia & Pacific", girlsData.countriesLanguages.asiaPacific)}
              {renderSection("Africa", girlsData.countriesLanguages.africa)}
              {renderSection("Middle East", girlsData.countriesLanguages.middleEast)}
              {renderSection("Languages", girlsData.countriesLanguages.languages)}
            </div>
          </div>
        </section>

        {/* Fetishes & Kinks */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            🎭 Fetishes & Kinks
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[0, 1, 2, 3].map((colIdx) => {
              const filtered = filterByLetter(girlsData.fetishesKinks);
              return (
                <div key={colIdx} className="space-y-2">
                  {filtered
                    .filter((_, idx) => idx % 4 === colIdx)
                    .map((item, idx) => (
                      <CategoryItem key={idx} item={item} />
                    ))}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
