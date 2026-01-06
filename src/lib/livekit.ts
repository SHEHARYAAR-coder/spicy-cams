import { RoomServiceClient, AccessToken } from "livekit-server-sdk";

export function validateLiveKitConfig() {
  const rawUrl = process.env.LIVEKIT_URL || "";
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!rawUrl || !apiKey || !apiSecret) {
    throw new Error(
      "LiveKit configuration missing. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET environment variables."
    );
  }

  // RoomServiceClient needs HTTPS URL; convert wss:// to https://
  let httpUrl = rawUrl;
  if (rawUrl.startsWith("wss://")) {
    httpUrl = rawUrl.replace("wss://", "https://");
  } else if (rawUrl.startsWith("ws://")) {
    httpUrl = rawUrl.replace("ws://", "http://");
  }

  // Client (browser) needs WSS URL
  let wsUrl = rawUrl;
  if (rawUrl.startsWith("https://")) {
    wsUrl = rawUrl.replace("https://", "wss://");
  } else if (rawUrl.startsWith("http://")) {
    wsUrl = rawUrl.replace("http://", "ws://");
  }

  return {
    url: rawUrl,
    httpUrl,
    wsUrl,
    apiKey,
    apiSecret,
  };
}

// Expose the WebSocket URL for client-side use
export function getLiveKitWsUrl(): string {
  const config = validateLiveKitConfig();
  return config.wsUrl;
}

let roomClient: RoomServiceClient | null = null;

function getRoomClient() {
  if (!roomClient) {
    const config = validateLiveKitConfig();
    roomClient = new RoomServiceClient(
      config.httpUrl,
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
  metadata?: Record<string, string | number | boolean>
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
    canSubscribe: false, // models don't need to subscribe to others
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
