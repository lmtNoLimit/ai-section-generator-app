/**
 * API endpoint for section feedback
 * Records thumbs up/down feedback after publish
 */

import { data, type ActionFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import prisma from '../db.server';

// Simple in-memory rate limiting (10 submissions per hour per shop)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(shop: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(shop);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(shop, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Validate MongoDB ObjectId format
 */
function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const sectionId = formData.get('sectionId') as string;
  const positive = formData.get('positive') === 'true';

  if (!sectionId) {
    return data({ error: 'Section ID required' }, { status: 400 });
  }

  // Validate ObjectId format to prevent NoSQL injection
  if (!isValidObjectId(sectionId)) {
    return data({ error: 'Invalid section ID format' }, { status: 400 });
  }

  // Check rate limit
  if (!checkRateLimit(session.shop)) {
    return data({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    // Verify section belongs to shop before recording feedback
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        shop: session.shop,
      },
    });

    if (!section) {
      return data({ error: 'Section not found' }, { status: 404 });
    }

    // Store feedback
    await prisma.sectionFeedback.create({
      data: {
        sectionId,
        shop: session.shop,
        positive,
      },
    });

    return data({ success: true, saved: true });
  } catch (error) {
    console.error('Feedback error:', error);
    // Return success but indicate save may have failed - don't block UX
    return data({ success: true, saved: false });
  }
}
