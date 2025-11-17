type ChatConnection = {
  userId: string;
  controller: ReadableStreamDefaultController;
  lastActivity: number;
};

const connections = new Map<string, Set<ChatConnection>>();

function ensureStreamEntry(streamId: string) {
  if (!connections.has(streamId)) {
    connections.set(streamId, new Set());
  }
}

export function registerConnection(streamId: string, connection: ChatConnection) {
  ensureStreamEntry(streamId);
  connections.get(streamId)!.add(connection);
}

export function unregisterConnection(streamId: string, connection: ChatConnection) {
  const streamConnections = connections.get(streamId);
  if (!streamConnections) return;

  streamConnections.delete(connection);
  if (streamConnections.size === 0) {
    connections.delete(streamId);
  }
}

export function broadcastMessage(streamId: string, event: unknown) {
  const streamConnections = connections.get(streamId);
  if (!streamConnections) return;

  const eventStr = `data: ${JSON.stringify(event)}\n\n`;

  streamConnections.forEach((conn) => {
    try {
      conn.controller.enqueue(eventStr);
      conn.lastActivity = Date.now();
    } catch {
      // swallow enqueue errors; connection cleanup runs elsewhere
    }
  });
}

export function broadcastModerationEvent(
  streamId: string,
  event: {
    type: "delete" | "mute" | "ban";
    targetUserId?: string;
    messageId?: string;
    duration?: number;
  }
) {
  const moderationEvent = {
    type: "moderation",
    data: event,
    timestamp: new Date().toISOString(),
  };

  broadcastMessage(streamId, moderationEvent);
}

// Cleanup stale connections every minute
setInterval(() => {
  const now = Date.now();
  const STALE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  connections.forEach((streamConnections, streamId) => {
    streamConnections.forEach((connection) => {
      if (now - connection.lastActivity > STALE_TIMEOUT) {
        try {
          connection.controller.close();
        } catch {
          // ignore close errors
        }
        streamConnections.delete(connection);
      }
    });

    if (streamConnections.size === 0) {
      connections.delete(streamId);
    }
  });
}, 60 * 1000);
