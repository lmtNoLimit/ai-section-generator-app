import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { chatService } from "../services/chat.server";

/**
 * Restore API endpoint for version management
 * POST /api/chat/restore
 *
 * Creates a new version from a previous version's code (non-destructive restore)
 * Body: FormData with conversationId, fromVersionId
 * Response: JSON with new version data
 */
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const conversationId = formData.get("conversationId") as string;
  const fromVersionId = formData.get("fromVersionId") as string;
  const fromVersionNumber = formData.get("fromVersionNumber") as string;

  // Input validation
  if (!conversationId || !fromVersionId) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: conversationId, fromVersionId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Authorization: verify conversation belongs to this shop
  const conversation = await chatService.getConversation(conversationId);
  if (!conversation || conversation.shop !== shop) {
    return new Response(
      JSON.stringify({ error: "Conversation not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Find the source message to restore from
  const sourceMessage = conversation.messages.find(m => m.id === fromVersionId);
  if (!sourceMessage || !sourceMessage.codeSnapshot) {
    return new Response(
      JSON.stringify({ error: "Version not found or has no code" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create restore message with metadata
  const restoreMessage = await chatService.createRestoreMessage(
    conversationId,
    sourceMessage.codeSnapshot,
    parseInt(fromVersionNumber) || 0
  );

  return new Response(
    JSON.stringify({
      success: true,
      message: restoreMessage,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
