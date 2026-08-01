import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { executeDeterministicRetrievalPipeline } from '@/lib/assistant/retrieval-pipeline';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId } = chatSchema.parse(body);

    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const conv = await prisma.engineeringConversation.create({
        data: {
          title: message.slice(0, 40) + '...',
          userId: session.id,
          organizationId: session.organizationId,
        },
      });
      activeConversationId = conv.id;
    }

    // Save User Message
    await prisma.engineeringMessage.create({
      data: {
        conversationId: activeConversationId,
        sender: 'USER',
        content: message,
      },
    });

    // Execute Grounded Retrieval Pipeline
    const groundedResult = await executeDeterministicRetrievalPipeline(message);

    // Save Assistant Response Message
    const assistantMsg = await prisma.engineeringMessage.create({
      data: {
        conversationId: activeConversationId,
        sender: 'ASSISTANT',
        content: groundedResult.answer,
        citationsJson: JSON.stringify(groundedResult.citations),
        confidenceScore: groundedResult.confidenceScore,
        scoreExplanation: groundedResult.scoreExplanation,
      },
    });

    return NextResponse.json({
      conversationId: activeConversationId,
      message: assistantMsg,
      groundedResult,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error executing assistant query:', error);
    return NextResponse.json({ error: 'Failed to process engineering query' }, { status: 500 });
  }
}
