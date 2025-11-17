import { RoomServiceClient, AccessToken, Room } from "livekit-server-sdk";

export function validateLiveKitConfig() {
  const config = {
    url: process.env.LIVEKIT_URL,
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
  };

  if (!config.url || !config.apiKey || !config.apiSecret) {
    throw new Error(
      "LiveKit configuration missing. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET environment variables."
    );
  }

  return config;
}

let roomClient: RoomServiceClient | null = null;

function getRoomClient() {
  if (!roomClient) {
    const config = validateLiveKitConfig();
    roomClient = new RoomServiceClient(
      config.url!,
      config.apiKey!,
      config.apiSecret!
    );
  }
  return roomClient;
}

export function getRoomNameFromStreamId(streamId: string): string {
  return `stream_${streamId}`;
}

export async function createRoom(
  roomName: string,
  metadata?: Record<string, any>
) {
  const client = getRoomClient();

  try {
    const room = await client.createRoom({
      name: roomName,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });

    return room;
  } catch (error) {
    console.error("Failed to create room:", error);
    throw new Error("Failed to create LiveKit room");
  }
}

export async function deleteRoom(roomName: string) {
  const client = getRoomClient();

  try {
    await client.deleteRoom(roomName);
  } catch (error) {
    console.error("Failed to delete room:", error);
    throw new Error("Failed to delete LiveKit room");
  }
}

export async function getRoomInfo(roomName: string) {
  const client = getRoomClient();

  try {
    const rooms = await client.listRooms([roomName]);
    return rooms.length > 0 ? rooms[0] : null;
  } catch (error) {
    console.error("Failed to get room info:", error);
    return null;
  }
}

export async function generateCreatorToken(roomName: string, identity: string) {
  const config = validateLiveKitConfig();

  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: false, // Creators don't need to subscribe to others
  });

  return await token.toJwt();
}

export async function generateViewerToken(roomName: string, identity: string) {
  const config = validateLiveKitConfig();

  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: false, // Viewers cannot publish
    canSubscribe: true,
  });

  return await token.toJwt();
}
