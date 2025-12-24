const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Categories matching your UI
const categories = [
  "Asian",
  "BDSM",
  "Big Cock",
  "Big Tits",
  "Black",
  "Huge Tits",
  "Latino",
  "Mature",
  "Medium Tits",
  "Mobile",
  "Small Tits",
  "Teen 18+",
  "Transgirl",
  "Transguy",
  "Uncut",
];

// Tag pools for each category
const tagsByCategory = {
  Asian: ["Japanese", "Korean", "Chinese", "Thai", "HD", "New"],
  BDSM: ["Dominant", "Submissive", "Roleplay", "Fetish", "Leather", "HD"],
  "Big Cock": ["Hung", "Uncut", "HD", "Private", "Cam2Cam"],
  "Big Tits": ["Natural", "Busty", "HD", "Curvy", "Stacked"],
  Black: ["Ebony", "Chocolate", "HD", "Exotic", "Beautiful"],
  "Huge Tits": ["Natural", "Massive", "Busty", "HD", "Goddess"],
  Latino: ["Latina", "Spanish", "HD", "Hot", "Spicy"],
  Mature: ["MILF", "Experienced", "Cougar", "HD", "Sexy"],
  "Medium Tits": ["Perfect", "Natural", "HD", "Fit", "Athletic"],
  Mobile: ["HD", "On-the-go", "Live", "Interactive"],
  "Small Tits": ["Petite", "Natural", "Teen 18+", "HD", "Cute"],
  "Teen 18+": ["Young", "Fresh", "New", "HD", "Legal"],
  Transgirl: ["Trans", "Shemale", "TS", "HD", "Beautiful"],
  Transguy: ["Trans", "FTM", "HD", "Handsome"],
  Uncut: ["Natural", "Foreskin", "HD", "European"],
};

// Stream titles and descriptions
const streamTemplates = [
  {
    titleTemplate: "Come Chat and Chill 💕",
    descTemplate: "Let's have some fun together! Tips are appreciated ❤️",
  },
  {
    titleTemplate: "Private Show Available 🔥",
    descTemplate: "Taking requests! Let me know what you'd like to see 😘",
  },
  {
    titleTemplate: "New Here! Say Hi 👋",
    descTemplate:
      "First time streaming, be nice! Let's get to know each other 💋",
  },
  {
    titleTemplate: "Goal: [Surprise] at 1000 tokens 🎯",
    descTemplate: "Help me reach my goal! Every tip counts 💖",
  },
  {
    titleTemplate: "Interactive Toy Show 🎮",
    descTemplate: "Control my toy with tips! Let's make it fun 😈",
  },
  {
    titleTemplate: "Late Night Fun 🌙",
    descTemplate: "Can't sleep? Keep me company! 💫",
  },
  {
    titleTemplate: "Weekend Special 🎉",
    descTemplate: "Let's celebrate! Special requests welcome 🥂",
  },
  {
    titleTemplate: "Premium Content Available 💎",
    descTemplate: "Ask me about my exclusive content! 🔞",
  },
  {
    titleTemplate: "Q&A and More 💬",
    descTemplate: "Ask me anything! Tips make me smile 😊",
  },
  {
    titleTemplate: "Tip Menu Available 📋",
    descTemplate: "Check my menu for special actions! All tips appreciated 💕",
  },
];

// Model names
const modelNames = [
  "Sophia",
  "Olivia",
  "Emma",
  "Ava",
  "Isabella",
  "Mia",
  "Luna",
  "Harper",
  "Ella",
  "Aria",
  "Scarlett",
  "Victoria",
  "Madison",
  "Grace",
  "Chloe",
  "Zoe",
  "Riley",
  "Lily",
  "Natalie",
  "Hannah",
  "Addison",
  "Brooklyn",
  "Samantha",
  "Layla",
  "Hazel",
  "Aurora",
  "Savannah",
  "Maya",
  "Skylar",
  "Bella",
  // Additional Asian model names
  "Sakura",
  "Yuki",
  "Mei",
  "Hana",
  "Aiko",
  "Yui",
  "Rin",
  "Miku",
  "Sora",
  "Nami",
  "Kira",
  "Haru",
  "Ayumi",
  "Kaori",
  "Miyu",
  "Akira",
  "Yuna",
  "Riko",
  "Momo",
  "Asami",
];

function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function createTestStreams() {
  try {
    console.log("🎬 Creating 30 test streams + 18 Asian category streams...");

    // First, ensure we have at least one model user
    let modelUsers = await prisma.user.findMany({
      where: {
        role: "MODEL",
      },
      include: {
        profile: true,
      },
    });

    // If no models exist, create some
    if (modelUsers.length === 0) {
      console.log("📝 No model users found. Creating test model users...");

      for (let i = 0; i < 50; i++) {
        const modelName = modelNames[i % modelNames.length];
        const email = `${modelName.toLowerCase()}${i}@test.com`;

        const user = await prisma.user.create({
          data: {
            email,
            passwordHash: "$2a$10$dummyhashfortest", // Dummy hash
            role: "MODEL",
            status: "ACTIVE",
            emailVerified: true,
            profile: {
              create: {
                displayName: modelName,
                isModel: true,
                avatarUrl: `https://i.pravatar.cc/300?u=${modelName}`,
                bio: `Hi! I'm ${modelName}. Come hang out with me! 💕`,
                category: getRandomItem(categories),
                language: "English",
                verificationStatus: "approved",
                profileCompleted: true,
              },
            },
            wallet: {
              create: {
                balance: 0,
                currency: "USD",
              },
            },
          },
        });

        modelUsers.push(user);
      }

      console.log(`✅ Created ${modelUsers.length} test model users`);
    }

    // Create 30 streams (distributed across categories)
    const streams = [];
    for (let i = 0; i < 30; i++) {
      const model = modelUsers[i % modelUsers.length];
      const category = categories[i % categories.length];
      const tags = getRandomItems(tagsByCategory[category] || [], 3);
      const template = getRandomItem(streamTemplates);

      const stream = await prisma.stream.create({
        data: {
          modelId: model.id,
          title: template.titleTemplate,
          description: template.descTemplate,
          category,
          tags,
          status: "LIVE", // Set all as LIVE for testing
          thumbnailUrl: `https://picsum.photos/seed/stream${i}/400/300`,
          livekitRoomName: `test-room-${Date.now()}-${i}`,
          startedAt: new Date(Date.now() - Math.random() * 3600000), // Started within last hour
          scheduledAt: new Date(Date.now() - Math.random() * 7200000),
          recordingEnabled: Math.random() > 0.5,
        },
        include: {
          model: {
            include: {
              profile: true,
            },
          },
        },
      });

      streams.push(stream);

      console.log(
        `✅ Created stream ${i + 1}/30: "${stream.title}" by ${
          stream.model.profile?.displayName || stream.model.email
        } [${category}]`
      );
    }

    // Create 18 additional Asian category streams
    console.log("\n🎌 Creating 18 additional Asian category streams...");
    for (let i = 0; i < 18; i++) {
      const model = modelUsers[(30 + i) % modelUsers.length];
      const category = "Asian";
      const tags = getRandomItems(tagsByCategory[category] || [], 3);
      const template = getRandomItem(streamTemplates);

      const stream = await prisma.stream.create({
        data: {
          modelId: model.id,
          title: template.titleTemplate,
          description: template.descTemplate,
          category,
          tags,
          status: "LIVE",
          thumbnailUrl: `https://picsum.photos/seed/asian${i}/400/300`,
          livekitRoomName: `test-asian-room-${Date.now()}-${i}`,
          startedAt: new Date(Date.now() - Math.random() * 3600000),
          scheduledAt: new Date(Date.now() - Math.random() * 7200000),
          recordingEnabled: Math.random() > 0.5,
        },
        include: {
          model: {
            include: {
              profile: true,
            },
          },
        },
      });

      streams.push(stream);

      console.log(
        `✅ Created Asian stream ${i + 1}/18: "${stream.title}" by ${
          stream.model.profile?.displayName || stream.model.email
        }`
      );
    }

    console.log(
      "\n🎉 Successfully created 48 test streams (30 general + 18 Asian)!"
    );
    console.log("\n📊 Summary:");

    // Count streams by category
    const categoryCounts = {};
    streams.forEach((stream) => {
      categoryCounts[stream.category] =
        (categoryCounts[stream.category] || 0) + 1;
    });

    console.log("\nStreams by category:");
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} streams`);
      });

    console.log("\n💡 You can now test your filters on the homepage!");
    console.log("   Visit: http://localhost:3000");
  } catch (error) {
    console.error("❌ Error creating test streams:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestStreams();
