import type { AgentSourcesPayload } from "@/types/agent";
import { agentSourcesPayloadSchema } from "@/schemas/agent";

export async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export function decodeAgentSources(header: string): AgentSourcesPayload | null {
  try {
    const bytes = Uint8Array.from(atob(header), (ch) => ch.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const result = agentSourcesPayloadSchema.safeParse(JSON.parse(json));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
