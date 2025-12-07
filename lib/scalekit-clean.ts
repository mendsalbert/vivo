import { ScalekitClient } from "@scalekit-sdk/node";

const ENV_URL =
  process.env.SCALEKIT_ENVIRONMENT_URL ||
  process.env.SCALEKIT_ENV_URL ||
  "https://vivo.scalekit.dev";

const CLIENT_ID = process.env.SCALEKIT_CLIENT_ID;
const CLIENT_SECRET = process.env.SCALEKIT_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn(
    "[Scalekit] SCALEKIT_CLIENT_ID or SCALEKIT_CLIENT_SECRET is not set. " +
      "Scalekit SSO URLs will not work until these are configured."
  );
}

// Singleton client
let client: ScalekitClient | null = null;

function getClient() {
  if (!client) {
    client = new ScalekitClient(ENV_URL!, CLIENT_ID!, CLIENT_SECRET!);
  }
  return client;
}

// Generate an authorization URL for a given connectionId (e.g. Gmail SSO)
export function getAuthorizationUrl(options: {
  connectionId: string;
  redirectUri: string;
  state?: string;
}) {
  const { connectionId, redirectUri, state } = options;
  const sc = getClient();

  const url = sc.getAuthorizationUrl(redirectUri, {
    connectionId,
    ...(state && { state }),
  });

  return { link: url };
}
