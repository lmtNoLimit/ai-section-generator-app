import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "../shopify.server";
import { chatService } from "../services/chat.server";

// Constants for input validation
const MAX_TITLE_LENGTH = 200;

/**
 * GET /api/chat/messages?conversationId=xxx
 * Returns all messages for a conversation
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  const sectionId = url.searchParams.get("sectionId");

  // If sectionId provided, get or create conversation
  if (sectionId) {
    const conversation = await chatService.getOrCreateConversation(sectionId, shop);
    const messages = await chatService.getMessages(conversation.id);
    return data({
      conversation: {
        id: conversation.id,
        sectionId: conversation.sectionId,
        title: conversation.title,
        messageCount: conversation.messageCount,
        isArchived: conversation.isArchived,
      },
      messages
    });
  }

  // Otherwise require conversationId
  if (!conversationId) {
    return data({ error: "Missing conversationId or sectionId" }, { status: 400 });
  }

  // Verify conversation belongs to this shop
  const conversation = await chatService.getConversation(conversationId);
  if (!conversation || conversation.shop !== shop) {
    return data({ error: "Conversation not found" }, { status: 404 });
  }

  const messages = await chatService.getMessages(conversationId);
  return data({
    conversation: {
      id: conversation.id,
      sectionId: conversation.sectionId,
      title: conversation.title,
      messageCount: conversation.messageCount,
      isArchived: conversation.isArchived,
    },
    messages
  });
}

/**
 * POST /api/chat/messages
 * Creates a new conversation for a section or updates conversation metadata
 *
 * Body: FormData with sectionId (required), title (optional)
 */
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const sectionId = formData.get("sectionId") as string;
  const conversationId = formData.get("conversationId") as string;

  // Create or get conversation for section
  if (intent === "create" || !intent) {
    if (!sectionId) {
      return data({ error: "Missing sectionId" }, { status: 400 });
    }

    const conversation = await chatService.getOrCreateConversation(sectionId, shop);
    return data({
      conversation: {
        id: conversation.id,
        sectionId: conversation.sectionId,
        title: conversation.title,
        messageCount: conversation.messageCount,
        isArchived: conversation.isArchived,
      }
    });
  }

  // Update conversation title
  if (intent === "updateTitle") {
    if (!conversationId) {
      return data({ error: "Missing conversationId" }, { status: 400 });
    }

    const title = formData.get("title") as string;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return data({ error: "Missing or empty title" }, { status: 400 });
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return data({ error: `Title exceeds maximum length of ${MAX_TITLE_LENGTH} characters` }, { status: 400 });
    }

    // Verify ownership BEFORE any data operations
    const conversation = await chatService.getConversation(conversationId);
    if (!conversation || conversation.shop !== shop) {
      return data({ error: "Conversation not found" }, { status: 404 });
    }

    await chatService.updateTitle(conversationId, title.trim());
    return data({ success: true });
  }

  // Archive conversation
  if (intent === "archive") {
    if (!conversationId) {
      return data({ error: "Missing conversationId" }, { status: 400 });
    }

    // Verify ownership
    const conversation = await chatService.getConversation(conversationId);
    if (!conversation || conversation.shop !== shop) {
      return data({ error: "Conversation not found" }, { status: 404 });
    }

    await chatService.archiveConversation(conversationId);
    return data({ success: true });
  }

  return data({ error: "Invalid intent" }, { status: 400 });
}
