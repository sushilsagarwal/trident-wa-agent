// In-memory session store
// For production scale, replace with Redis or a DB
const sessions = new Map();

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour inactivity timeout
const MAX_HISTORY = 20; // max messages to keep per user

export function getOrCreateSession(phoneNumber) {
  const now = Date.now();

  if (sessions.has(phoneNumber)) {
    const session = sessions.get(phoneNumber);
    // Check TTL — reset if inactive for 1 hour
    if (now - session.lastActivity > SESSION_TTL_MS) {
      sessions.delete(phoneNumber);
      return createSession(phoneNumber);
    }
    session.lastActivity = now;
    return session;
  }

  return createSession(phoneNumber);
}

function createSession(phoneNumber) {
  const session = {
    phoneNumber,
    history: [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
    messageCount: 0,
  };
  sessions.set(phoneNumber, session);
  return session;
}

export function updateSession(phoneNumber, userMessage, assistantReply) {
  const session = getOrCreateSession(phoneNumber);

  session.history.push(
    { role: "user", content: userMessage },
    { role: "assistant", content: assistantReply }
  );

  // Keep history within bounds
  if (session.history.length > MAX_HISTORY * 2) {
    session.history = session.history.slice(-MAX_HISTORY * 2);
  }

  session.messageCount += 1;
  session.lastActivity = Date.now();
}

export function clearSession(phoneNumber) {
  sessions.delete(phoneNumber);
}

export function getSessionStats() {
  return {
    activeSessions: sessions.size,
    users: [...sessions.keys()].map((phone) => ({
      phone: phone.slice(0, 6) + "****", // masked
      messages: sessions.get(phone).messageCount,
      lastActivity: new Date(sessions.get(phone).lastActivity).toISOString(),
    })),
  };
}

// Cleanup expired sessions every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [phone, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TTL_MS) {
      sessions.delete(phone);
    }
  }
}, 15 * 60 * 1000);
