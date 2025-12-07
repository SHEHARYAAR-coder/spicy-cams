import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch user profile
export async function GET(_req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// POST: Fetch user profile by user ID
export async function POST(req: NextRequest) {
  // Check authentication
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find user by ID with all related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wallet: true,
        _count: {
          select: {
            streams: true,
            follows: true,
            followers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update user profile
export async function PUT(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const body = await req.json();
    const {
      displayName,
      bio,
      category,
      language,
      isModel,
      targetRole,
      // model profile fields
      hairColor,
      physique,
      breastSize,
      pubicHair,
      displayedAge,
      spokenLanguages,
      relationship,
      ethnicity,
      piercings,
      tattoos,
      displayedCity,
      myShows,
      profileDescription,
      // Media gallery
      profileImages,
      profileVideos,
      // Verification documents
      idFrontUrl,
      idBackUrl,
      facePhotoUrl,
      verificationStatus,
      profileCompleted,
    } = body;

    if (targetRole && targetRole !== "MODEL") {
      return NextResponse.json(
        { error: "Unsupported role change" },
        { status: 400 }
      );
    }

    // Validate displayedAge if provided
    if (typeof displayedAge === "number" && displayedAge < 18) {
      return NextResponse.json(
        { error: "Displayed age must be 18 or older" },
        { status: 400 }
      );
    }

    // Validate profileDescription length if provided
    if (
      typeof profileDescription === "string" &&
      profileDescription.length > 350
    ) {
      return NextResponse.json(
        { error: "Profile description must be 350 characters or less" },
        { status: 400 }
      );
    }

    // Get current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isUserCreator =
      currentUser?.role === "MODEL" || targetRole === "MODEL";

    const profileUpdateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof displayName !== "undefined")
      profileUpdateData.displayName = displayName;

    // model users, sync bio and profileDescription
    if (isUserCreator) {
      if (typeof bio !== "undefined") {
        profileUpdateData.bio = bio;
        profileUpdateData.profileDescription = bio; // Sync profileDescription with bio
      }
      if (typeof profileDescription !== "undefined") {
        profileUpdateData.profileDescription = profileDescription;
        profileUpdateData.bio = profileDescription; // Sync bio with profileDescription
      }
    } else {
      // model users, update independently
      if (typeof bio !== "undefined") profileUpdateData.bio = bio;
      if (typeof profileDescription !== "undefined")
        profileUpdateData.profileDescription = profileDescription;
    }

    if (typeof category !== "undefined") profileUpdateData.category = category;
    if (typeof language !== "undefined") profileUpdateData.language = language;
    if (typeof isModel === "boolean") profileUpdateData.isModel = isModel;
    if (targetRole === "MODEL") profileUpdateData.isModel = true;

    // model profile fields
    if (typeof hairColor !== "undefined")
      profileUpdateData.hairColor = hairColor;
    if (typeof physique !== "undefined") profileUpdateData.physique = physique;
    if (typeof breastSize !== "undefined")
      profileUpdateData.breastSize = breastSize;
    if (typeof pubicHair !== "undefined")
      profileUpdateData.pubicHair = pubicHair;
    if (typeof displayedAge !== "undefined")
      profileUpdateData.displayedAge = displayedAge;
    if (Array.isArray(spokenLanguages))
      profileUpdateData.spokenLanguages = spokenLanguages;
    if (typeof relationship !== "undefined")
      profileUpdateData.relationship = relationship;
    if (typeof ethnicity !== "undefined")
      profileUpdateData.ethnicity = ethnicity;
    if (typeof piercings !== "undefined")
      profileUpdateData.piercings = piercings;
    if (typeof tattoos !== "undefined") profileUpdateData.tattoos = tattoos;
    if (typeof displayedCity !== "undefined")
      profileUpdateData.displayedCity = displayedCity;
    if (Array.isArray(myShows)) profileUpdateData.myShows = myShows;
    if (Array.isArray(profileImages))
      profileUpdateData.profileImages = profileImages;
    if (Array.isArray(profileVideos))
      profileUpdateData.profileVideos = profileVideos;

    // Verification documents
    if (typeof idFrontUrl !== "undefined")
      profileUpdateData.idFrontUrl = idFrontUrl;
    if (typeof idBackUrl !== "undefined")
      profileUpdateData.idBackUrl = idBackUrl;
    if (typeof facePhotoUrl !== "undefined")
      profileUpdateData.facePhotoUrl = facePhotoUrl;
    if (typeof verificationStatus !== "undefined")
      profileUpdateData.verificationStatus = verificationStatus;
    if (typeof profileCompleted === "boolean")
      profileUpdateData.profileCompleted = profileCompleted;

    // Determine the bio/profileDescription values with syncing logic for models
    let bioValue = typeof bio === "string" && bio.length > 0 ? bio : null;
    let profileDescValue =
      typeof profileDescription === "string" && profileDescription.length > 0
        ? profileDescription
        : null;

    // model users, sync bio and profileDescription on creation
    if (isUserCreator) {
      if (bioValue !== null) {
        profileDescValue = bioValue; // Sync profileDescription with bio
      } else if (profileDescValue !== null) {
        bioValue = profileDescValue; // Sync bio with profileDescription
      }
    }

    const profileCreateData = {
      userId,
      displayName:
        typeof displayName === "string" && displayName.length > 0
          ? displayName
          : session.user.name || session.user.email || "Model",
      bio: bioValue,
      category:
        typeof category === "string" && category.length > 0 ? category : null,
      language:
        typeof language === "string" && language.length > 0 ? language : null,
      isModel:
        targetRole === "MODEL"
          ? true
          : typeof isModel === "boolean"
          ? isModel
          : false,
      // model profile fields
      hairColor:
        typeof hairColor === "string" && hairColor.length > 0
          ? hairColor
          : null,
      physique:
        typeof physique === "string" && physique.length > 0 ? physique : null,
      breastSize:
        typeof breastSize === "string" && breastSize.length > 0
          ? breastSize
          : null,
      pubicHair:
        typeof pubicHair === "string" && pubicHair.length > 0
          ? pubicHair
          : null,
      displayedAge: typeof displayedAge === "number" ? displayedAge : null,
      spokenLanguages: Array.isArray(spokenLanguages) ? spokenLanguages : [],
      relationship:
        typeof relationship === "string" && relationship.length > 0
          ? relationship
          : null,
      ethnicity:
        typeof ethnicity === "string" && ethnicity.length > 0
          ? ethnicity
          : null,
      piercings:
        typeof piercings === "string" && piercings.length > 0
          ? piercings
          : null,
      tattoos:
        typeof tattoos === "string" && tattoos.length > 0 ? tattoos : null,
      displayedCity:
        typeof displayedCity === "string" && displayedCity.length > 0
          ? displayedCity
          : null,
      myShows: Array.isArray(myShows) ? myShows : [],
      profileDescription: profileDescValue,
      profileImages: Array.isArray(profileImages) ? profileImages : [],
      profileVideos: Array.isArray(profileVideos) ? profileVideos : [],
      // Verification documents
      idFrontUrl:
        typeof idFrontUrl === "string" && idFrontUrl.length > 0
          ? idFrontUrl
          : null,
      idBackUrl:
        typeof idBackUrl === "string" && idBackUrl.length > 0
          ? idBackUrl
          : null,
      facePhotoUrl:
        typeof facePhotoUrl === "string" && facePhotoUrl.length > 0
          ? facePhotoUrl
          : null,
      verificationStatus:
        typeof verificationStatus === "string" && verificationStatus.length > 0
          ? verificationStatus
          : "pending",
      profileCompleted:
        typeof profileCompleted === "boolean"
          ? profileCompleted
          : false,
    };

    // Update profile
    await prisma.profile.upsert({
      where: { userId },
      update: profileUpdateData,
      create: profileCreateData,
    });

    // Update role if needed
    if (targetRole === "MODEL") {
      await prisma.user.updateMany({
        where: {
          id: userId,
          role: { not: "MODEL" },
        },
        data: { role: "MODEL" },
      });
    }

    // Return updated user data with profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wallet: true,
        _count: {
          select: {
            streams: true,
            follows: true,
            followers: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
