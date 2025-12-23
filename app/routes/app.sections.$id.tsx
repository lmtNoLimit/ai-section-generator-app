import { useEffect, useCallback } from 'react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  data,
} from 'react-router';
import { authenticate } from '../shopify.server';
import { themeAdapter } from '../services/adapters/theme-adapter';
import { sectionService } from '../services/section.server';
import { chatService } from '../services/chat.server';
import prisma from '../db.server';

import {
  UnifiedEditorLayout,
  EditorHeader,
  ChatPanelWrapper,
  CodePreviewPanel,
  EditorSettingsPanel,
  useEditorState,
} from '../components/editor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

import type { SaveActionData, Theme, UIMessage } from '../types';
import { SECTION_STATUS } from '../types/section-status';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const sectionId = params.id;

  if (!sectionId) {
    throw data({ message: 'Section ID required' }, { status: 400 });
  }

  // Load section
  const section = await sectionService.getById(sectionId, shop);
  if (!section) {
    throw data({ message: 'Section not found' }, { status: 404 });
  }

  // Load themes
  const themes = await themeAdapter.getThemes(request);

  // Load or create conversation
  const conversation = await chatService.getOrCreateConversation(sectionId, shop);
  const messages = await chatService.getMessages(conversation.id);

  return {
    section,
    themes,
    conversation: {
      id: conversation.id,
      messages,
    },
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const sectionId = params.id!;

  const formData = await request.formData();
  const actionType = formData.get('action');

  if (actionType === 'saveDraft') {
    const code = formData.get('code') as string;
    const name = formData.get('name') as string;

    try {
      await sectionService.update(sectionId, shop, {
        name,
        status: SECTION_STATUS.DRAFT,
      });

      await prisma.section.update({
        where: { id: sectionId },
        data: { code },
      });

      return { success: true, message: 'Draft saved!' } satisfies SaveActionData;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save draft.',
      } satisfies SaveActionData;
    }
  }

  if (actionType === 'publish') {
    const code = formData.get('code') as string;
    const name = formData.get('name') as string;
    const themeId = formData.get('themeId') as string;
    const fileName = formData.get('fileName') as string;
    const themeName = formData.get('themeName') as string;

    try {
      // Save to theme
      await themeAdapter.createSection(request, themeId, fileName, code, name);

      // Update section
      await sectionService.update(sectionId, shop, {
        name,
        status: SECTION_STATUS.ACTIVE,
        themeId,
        themeName,
        fileName,
      });

      await prisma.section.update({
        where: { id: sectionId },
        data: { code },
      });

      return {
        success: true,
        message: `Published to ${fileName}!`,
      } satisfies SaveActionData;
    } catch (error) {
      console.error('Failed to publish:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to publish.',
      } satisfies SaveActionData;
    }
  }

  if (actionType === 'updateName') {
    const name = formData.get('name') as string;
    await sectionService.update(sectionId, shop, { name });
    return { success: true };
  }

  if (actionType === 'archive') {
    try {
      await sectionService.archive(sectionId, shop);
      return {
        success: true,
        message: 'Section archived.',
        redirect: '/app/sections?view=archive',
      } satisfies SaveActionData;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to archive.',
      } satisfies SaveActionData;
    }
  }

  if (actionType === 'deactivate') {
    try {
      await sectionService.update(sectionId, shop, {
        status: SECTION_STATUS.INACTIVE,
      });
      return {
        success: true,
        message: 'Section deactivated.',
        redirect: '/app/sections?view=inactive',
      } satisfies SaveActionData;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to deactivate.',
      } satisfies SaveActionData;
    }
  }

  if (actionType === 'restore') {
    try {
      await sectionService.update(sectionId, shop, {
        status: SECTION_STATUS.DRAFT,
      });
      return {
        success: true,
        message: 'Section restored to draft.',
      } satisfies SaveActionData;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to restore.',
      } satisfies SaveActionData;
    }
  }

  return data({ error: 'Unknown action' }, { status: 400 });
}

export default function UnifiedEditorPage() {
  const { section, themes, conversation } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const {
    sectionCode,
    sectionName,
    setSectionName,
    handleCodeUpdate,
    lastCodeSource,
    revertToOriginal,
    canRevert,
    conversationId,
    initialMessages,
    selectedTheme,
    setSelectedTheme,
    selectedThemeName,
    fileName,
    setFileName,
    isDirty,
    canPublish,
  } = useEditorState({
    section,
    themes: themes as Theme[],
    conversation: conversation as { id: string; messages: UIMessage[] },
  });

  const isLoading = navigation.state === 'submitting';
  const isSavingDraft = isLoading && navigation.formData?.get('action') === 'saveDraft';
  const isPublishing = isLoading && navigation.formData?.get('action') === 'publish';

  // Save handlers
  const handleSaveDraft = useCallback(() => {
    if (isLoading) return;
    const formData = new FormData();
    formData.append('action', 'saveDraft');
    formData.append('code', sectionCode);
    formData.append('name', sectionName);
    submit(formData, { method: 'post' });
  }, [isLoading, sectionCode, sectionName, submit]);

  const handlePublish = useCallback(() => {
    if (isLoading || !canPublish) return;
    const formData = new FormData();
    formData.append('action', 'publish');
    formData.append('code', sectionCode);
    formData.append('name', sectionName);
    formData.append('themeId', selectedTheme);
    formData.append('fileName', fileName);
    formData.append('themeName', selectedThemeName);
    submit(formData, { method: 'post' });
  }, [isLoading, canPublish, sectionCode, sectionName, selectedTheme, fileName, selectedThemeName, submit]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 's',
        ctrl: true,
        action: handleSaveDraft,
        description: 'Save draft',
      },
      {
        key: 's',
        ctrl: true,
        shift: true,
        action: handlePublish,
        description: 'Publish to theme',
        enabled: canPublish,
      },
    ],
  });

  const handleNameChange = (name: string) => {
    setSectionName(name);
    const formData = new FormData();
    formData.append('action', 'updateName');
    formData.append('name', name);
    submit(formData, { method: 'post' });
  };

  // Show toast on success and handle redirects
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
      if ('message' in actionData && actionData.message) {
        shopify.toast.show(actionData.message);
      }
      if ('redirect' in actionData && actionData.redirect) {
        window.location.href = actionData.redirect;
      }
    }
  }, [actionData]);

  return (
    <s-page inlineSize="large">
      <EditorHeader
        sectionName={sectionName}
        onNameChange={handleNameChange}
        isDirty={isDirty}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        isSavingDraft={isSavingDraft}
        isPublishing={isPublishing}
        canPublish={canPublish}
        themeName={selectedThemeName}
        canRevert={canRevert}
        onRevert={revertToOriginal}
        lastCodeSource={lastCodeSource}
      />

      <UnifiedEditorLayout
        chatPanel={
          conversationId ? (
            <ChatPanelWrapper
              conversationId={conversationId}
              initialMessages={initialMessages}
              currentCode={sectionCode}
              onCodeUpdate={handleCodeUpdate}
            />
          ) : (
            <div className="chat-panel-wrapper">
              <div className="chat-panel-wrapper__header">
                <h2>AI Assistant</h2>
                <p>Loading conversation...</p>
              </div>
            </div>
          )
        }
        codePreviewPanel={
          <CodePreviewPanel
            code={sectionCode}
            fileName={fileName}
          />
        }
        settingsPanel={
          <EditorSettingsPanel
            themes={themes as Theme[]}
            selectedTheme={selectedTheme}
            onThemeChange={setSelectedTheme}
            fileName={fileName}
            onFileNameChange={setFileName}
            disabled={isLoading}
          />
        }
      />
    </s-page>
  );
}

// Error boundary for 404
export function ErrorBoundary() {
  return (
    <s-page heading="Section Not Found" inlineSize="large">
      <s-stack gap="large" direction="block" alignItems="center">
        <s-section>
          <s-stack gap="base" alignItems="center">
            <s-heading>Section not found</s-heading>
            <s-paragraph>
              The section you are looking for does not exist or you do not have
              access to it.
            </s-paragraph>
            <s-button
              variant="primary"
              onClick={() => (window.location.href = '/app/sections')}
            >
              Back to Sections
            </s-button>
          </s-stack>
        </s-section>
      </s-stack>
    </s-page>
  );
}
