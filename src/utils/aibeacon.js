/**
 * Checks whether the user has configured both external platform API keys
 * required for aiBeacon course operations.
 *
 * The backend does not expose raw key values to the frontend (`select: false`),
 * so timestamps are the frontend source of truth for "configured" status.
 */
export function hasAiBeaconAndMoodleApiKeys(user) {
  if (!user) return false;

  const hasAiBeacon = !!user.aiBeaconApiKeyCreatedAt;
  const hasMoodle = !!user.moodleApiKeyCreatedAt;

  return hasAiBeacon && hasMoodle;
}

