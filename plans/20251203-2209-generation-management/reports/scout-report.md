# Codebase Architecture Scout Report

Generated: 2025-12-03
Scope: Route patterns, service architecture, component structure, design guidelines

---

## 1. ROUTE STRUCTURE PATTERNS

### Overview
Routes follow React Router 7.9+ conventions with nested app routes (protected by auth) and webhook handlers.

### Loader Pattern
```typescript
// File: app/routes/app.generate.tsx (lines 18-22)
export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);  // Auth check
  const themes = await themeAdapter.getThemes(request);
  return { themes };
}

// File: app/routes/app.history.tsx (lines 12-34)
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const status = url.searchParams.get("status") || undefined;
  const favoritesOnly = url.searchParams.get("favorites") === "true";
  
  const history = await historyService.getByShop(shop, {
    page,
    limit: 20,
    status,
    favoritesOnly,
  });
  return { history };
}

// File: app/routes/app._index.tsx (lines 23-54)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const [historyCount, templateCount, weeklyCount, shopSettings] =
    await Promise.all([
      prisma.generationHistory.count({ where: { shop } }),
      prisma.sectionTemplate.count({ where: { shop } }),
      prisma.generationHistory.count({
        where: {
          shop,
          createdAt: { gte: getStartOfWeek() },
        },
      }),
      settingsService.get(shop),
    ]);
  return {
    stats: {
      sectionsGenerated: historyCount,
      templatesSaved: templateCount,
      generationsThisWeek: weeklyCount,
    },
    onboarding: {
      hasGeneratedSection: historyCount > 0,
      hasSavedTemplate: templateCount > 0,
      hasViewedHistory: shopSettings?.hasViewedHistory ?? false,
      isDismissed: shopSettings?.onboardingDismissed ?? false,
    },
  };
};
```

**Key Points:**
- All loaders call `authenticate.admin(request)` first
- Extract shop from `session.shop`
- Support URL query params for filtering/pagination
- Use `Promise.all()` for parallel queries
- Loaders return typed data objects

### Action Pattern
```typescript
// File: app/routes/app.generate.tsx (lines 24-136)
export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "generate") {
    const prompt = formData.get("prompt") as string;
    const tone = formData.get("tone") as string | null;
    const style = formData.get("style") as string | null;

    const quotaCheck = await canGenerate(shop);
    if (!quotaCheck.allowed) {
      return {
        error: quotaCheck.reason || "Generation limit reached",
        quota: quotaCheck.quota,
      };
    }

    const code = await aiAdapter.generateSection(prompt);
    const historyEntry = await historyService.create({
      shop,
      prompt,
      code,
      tone: tone || undefined,
      style: style || undefined,
    });

    trackGeneration(admin, shop, historyEntry.id, prompt).catch((error) => {
      console.error("Failed to track generation:", error);
    });

    return {
      code,
      prompt,
      historyId: historyEntry.id,
      quota: quotaCheck.quota,
    } satisfies GenerateActionData;
  }

  if (actionType === "save") {
    const themeId = formData.get("themeId") as string;
    const fileName = formData.get("fileName") as string;
    const content = formData.get("content") as string;
    const historyId = formData.get("historyId") as string | null;

    try {
      const result = await themeAdapter.createSection(request, themeId, fileName, content);
      if (historyId) {
        const themeName = formData.get("themeName") as string | null;
        await historyService.update(historyId, shop, {
          themeId,
          themeName: themeName || undefined,
          fileName,
          status: "saved",
        });
      }
      return {
        success: true,
        message: `Section saved successfully to ${result?.filename || fileName}!`
      } satisfies SaveActionData;
    } catch (error) {
      console.error("Failed to save section:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to save section. Please try again."
      } satisfies SaveActionData;
    }
  }

  if (actionType === "saveAsTemplate") {
    // Template save logic...
  }

  return null;
}

// File: app/routes/app.history.tsx (lines 36-55)
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "toggleFavorite") {
    const id = formData.get("id") as string;
    await historyService.toggleFavorite(id, shop);
    return { success: true, action: "toggleFavorite" };
  }

  if (actionType === "delete") {
    const id = formData.get("id") as string;
    await historyService.delete(id, shop);
    return { success: true, action: "delete" };
  }

  return null;
}
```

**Key Points:**
- Discriminate actions via `formData.get("action")`
- Each action handles distinct business logic
- Use service methods for DB operations
- Return typed response objects (GenerateActionData, SaveActionData)
- Handle errors with try-catch and user-friendly messages
- Support async side-effects (trackGeneration) without blocking response

### Component Pattern
```typescript
// File: app/routes/app.generate.tsx (lines 138-308)
export default function GeneratePage() {
  const { themes } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [prompt, setPrompt] = useState(actionData?.prompt || "");
  const [generatedCode, setGeneratedCode] = useState(actionData?.code || "");
  const [currentHistoryId, setCurrentHistoryId] = useState(actionData?.historyId || "");

  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptionsState>({
    tone: 'professional',
    style: 'minimal',
    includeSchema: true
  });

  const activeTheme = themes.find((theme: Theme) => theme.role === "MAIN");
  const [selectedTheme, setSelectedTheme] = useState(activeTheme?.id || themes[0]?.id || "");

  const [fileName, setFileName] = useState("ai-section");
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  const isLoading = navigation.state === "submitting";
  const isGenerating = isLoading && navigation.formData?.get("action") === "generate";
  const isSaving = isLoading && navigation.formData?.get("action") === "save";

  // Update state when action data changes
  useEffect(() => {
    if (actionData?.code && actionData.code !== generatedCode) {
      setGeneratedCode(actionData.code);
    }
    if (actionData?.historyId && actionData.historyId !== currentHistoryId) {
      setCurrentHistoryId(actionData.historyId);
    }
  }, [actionData?.code, actionData?.historyId, generatedCode, currentHistoryId]);

  const selectedThemeName = themes.find((t: Theme) => t.id === selectedTheme)?.name || 'theme';

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    const formData = new FormData();
    formData.append("action", "generate");
    formData.append("prompt", prompt);
    formData.append("tone", advancedOptions.tone);
    formData.append("style", advancedOptions.style);
    submit(formData, { method: "post" });
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.append("action", "save");
    formData.append("themeId", selectedTheme);
    formData.append("fileName", fileName);
    formData.append("content", generatedCode);
    formData.append("themeName", selectedThemeName);
    if (currentHistoryId) {
      formData.append("historyId", currentHistoryId);
    }
    submit(formData, { method: "post" });
  };

  const canSave = Boolean(generatedCode && fileName && selectedTheme);

  const handleSaveAsTemplate = (data: {
    title: string;
    description: string;
    category: string;
    icon: string;
    prompt: string;
  }) => {
    const formData = new FormData();
    formData.append("action", "saveAsTemplate");
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("icon", data.icon);
    formData.append("prompt", data.prompt);
    if (generatedCode) {
      formData.append("code", generatedCode);
    }
    submit(formData, { method: "post" });
    setShowSaveTemplateModal(false);
  };

  useEffect(() => {
    if (actionData?.templateSaved) {
      setShowSaveTemplateModal(false);
    }
  }, [actionData?.templateSaved]);

  return (
    <>
      <s-page heading="Generate Section" inlineSize="large">
        <s-stack gap="large" direction="block">
          {/* Feedback banners */}
          {actionData?.templateSaved && (
            <s-banner tone="success" dismissible>
              Template saved successfully! View your templates in the Templates Library.
            </s-banner>
          )}

          {actionData?.success && !actionData?.templateSaved && (
            <s-banner tone="success" dismissible>
              Section saved successfully to {selectedThemeName}!
            </s-banner>
          )}

          {actionData?.success === false && (
            <s-banner tone="critical">
              {actionData.message}
            </s-banner>
          )}

          {/* Two-column layout */}
          <GenerateLayout
            inputColumn={
              <GenerateInputColumn
                prompt={prompt}
                onPromptChange={setPrompt}
                advancedOptions={advancedOptions}
                onAdvancedOptionsChange={setAdvancedOptions}
                disabled={isGenerating || isSaving}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            }
            previewColumn={
              <GeneratePreviewColumn
                generatedCode={generatedCode}
                themes={themes}
                selectedTheme={selectedTheme}
                onThemeChange={setSelectedTheme}
                fileName={fileName}
                onFileNameChange={setFileName}
                onSave={handleSave}
                onSaveAsTemplate={() => setShowSaveTemplateModal(true)}
                isSaving={isSaving}
                isGenerating={isGenerating}
                canSave={canSave}
              />
            }
          />
        </s-stack>
      </s-page>

      {showSaveTemplateModal && (
        <SaveTemplateModal
          defaultPrompt={prompt}
          onSave={handleSaveAsTemplate}
          onClose={() => setShowSaveTemplateModal(false)}
        />
      )}
    </>
  );
}
```

**Key Points:**
- Use `useLoaderData<typeof loader>()` for typed access to loader data
- Use `useActionData<typeof action>()` for typed response from actions
- Use `navigation.state` to determine loading/submitting state
- Use `useSubmit()` to send FormData to actions
- State derives from actionData when available
- Compute derived state (isGenerating, isSaving) from navigation
- Use conditional rendering for loading/empty/error states

---

## 2. HISTORY SERVICE API

### File: /Users/lmtnolimit/working/ai-section-generator/app/services/history.server.ts

#### Interfaces
```typescript
export interface CreateHistoryInput {
  shop: string;
  prompt: string;
  code: string;
  tone?: string;
  style?: string;
}

export interface UpdateHistoryInput {
  themeId?: string;
  themeName?: string;
  fileName?: string;
  status?: string;
  isFavorite?: boolean;
}
```

#### Methods

##### create(input: CreateHistoryInput) → Promise<GenerationHistory>
Creates new history entry after generation.
```typescript
async create(input: CreateHistoryInput): Promise<GenerationHistory> {
  return prisma.generationHistory.create({
    data: {
      shop: input.shop,
      prompt: input.prompt,
      code: input.code,
      tone: input.tone,
      style: input.style,
      status: "generated",
    },
  });
}
```

##### getByShop(shop, options) → Promise<PaginatedResponse>
Fetch paginated history for a shop with filtering.
```typescript
async getByShop(
  shop: string,
  options: { page?: number; limit?: number; status?: string; favoritesOnly?: boolean } = {}
): Promise<{ items: GenerationHistory[]; total: number; page: number; totalPages: number }> {
  const { page = 1, limit = 20, status, favoritesOnly } = options;
  const skip = (page - 1) * limit;

  const where = {
    shop,
    ...(status && { status }),
    ...(favoritesOnly && { isFavorite: true }),
  };

  const [items, total] = await Promise.all([
    prisma.generationHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.generationHistory.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
```

**Return Type:**
```typescript
{
  items: GenerationHistory[];  // Paginated records
  total: number;               // Total count
  page: number;                // Current page
  totalPages: number;          // Total pages
}
```

##### getById(id, shop) → Promise<GenerationHistory | null>
Fetch single history entry with ownership check.
```typescript
async getById(id: string, shop: string): Promise<GenerationHistory | null> {
  return prisma.generationHistory.findFirst({
    where: { id, shop },
  });
}
```

##### update(id, shop, input) → Promise<GenerationHistory | null>
Update history entry (e.g., when saved to theme).
```typescript
async update(id: string, shop: string, input: UpdateHistoryInput): Promise<GenerationHistory | null> {
  const existing = await prisma.generationHistory.findFirst({
    where: { id, shop },
  });
  if (!existing) return null;
  return prisma.generationHistory.update({
    where: { id },
    data: input,
  });
}
```

##### toggleFavorite(id, shop) → Promise<GenerationHistory | null>
Toggle favorite status of history entry.
```typescript
async toggleFavorite(id: string, shop: string): Promise<GenerationHistory | null> {
  const existing = await prisma.generationHistory.findFirst({
    where: { id, shop },
  });
  if (!existing) return null;
  return prisma.generationHistory.update({
    where: { id },
    data: { isFavorite: !existing.isFavorite },
  });
}
```

##### delete(id, shop) → Promise<boolean>
Delete history entry with ownership check.
```typescript
async delete(id: string, shop: string): Promise<boolean> {
  const existing = await prisma.generationHistory.findFirst({
    where: { id, shop },
  });
  if (!existing) return false;
  await prisma.generationHistory.delete({ where: { id } });
  return true;
}
```

##### getMostRecent(shop) → Promise<GenerationHistory | null>
Get most recent generation for a shop.
```typescript
async getMostRecent(shop: string): Promise<GenerationHistory | null> {
  return prisma.generationHistory.findFirst({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });
}
```

#### Security Pattern
All methods enforce **shop-based access control**:
```typescript
// ✅ Security check: Verify ownership
const existing = await prisma.generationHistory.findFirst({
  where: { id, shop },  // Must match both id AND shop
});
```

---

## 3. COMPONENT STRUCTURE

### Directory: /Users/lmtnolimit/working/ai-section-generator/app/components/generate/

All components are functional React components with Polaris web components (`<s-*>` tags).

#### Layout Components

##### GenerateLayout
Two-column responsive layout for generate screen.
```typescript
// File: GenerateLayout.tsx
export interface GenerateLayoutProps {
  inputColumn: ReactNode;
  previewColumn: ReactNode;
}

export function GenerateLayout({ inputColumn, previewColumn }: GenerateLayoutProps) {
  return (
    <s-grid gap="large" gridTemplateColumns="1fr 2fr">
      {/* Primary column (1/3) */}
      <s-stack gap="large" direction="block">
        {inputColumn}
      </s-stack>

      {/* Secondary column (2/3) */}
      <s-stack gap="large" direction="block">
        {previewColumn}
      </s-stack>
    </s-grid>
  );
}
```

**Pattern:** Follows Shopify Details template (2/3 content, 1/3 supporting info)

##### GenerateInputColumn
Primary column with prompt, templates, and options.
```typescript
// File: GenerateInputColumn.tsx
export interface GenerateInputColumnProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  advancedOptions: AdvancedOptionsState;
  onAdvancedOptionsChange: (options: AdvancedOptionsState) => void;
  disabled: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function GenerateInputColumn({
  prompt,
  onPromptChange,
  advancedOptions,
  onAdvancedOptionsChange,
  disabled,
  onGenerate,
  isGenerating,
}: GenerateInputColumnProps) {
  const isPromptValid = prompt.trim().length >= 10 && prompt.trim().length <= 2000;

  return (
    <>
      <s-section heading="Describe your section">
        <s-stack gap="large" direction="block">
          <PromptInput
            value={prompt}
            onChange={onPromptChange}
            disabled={disabled}
          />
          <AdvancedOptions
            value={advancedOptions}
            onChange={onAdvancedOptionsChange}
            disabled={disabled}
          />
          <s-button
            variant="primary"
            onClick={onGenerate}
            loading={isGenerating || undefined}
            disabled={disabled || !isPromptValid}
          >
            Generate Code
          </s-button>
        </s-stack>
      </s-section>

      <s-section heading="Quick Start Templates">
        <TemplateSuggestions
          onSelectTemplate={onPromptChange}
          disabled={disabled}
        />
      </s-section>

      <s-section heading="Example Prompts">
        <PromptExamples onSelectExample={onPromptChange} disabled={disabled} />
      </s-section>
    </>
  );
}
```

**Sections:**
- "Describe your section" - prompt input + advanced options + generate button
- "Quick Start Templates" - template suggestions
- "Example Prompts" - example prompts

##### GeneratePreviewColumn
Secondary column with code/preview tabs, theme selector, and save controls.
```typescript
// File: GeneratePreviewColumn.tsx
export interface GeneratePreviewColumnProps {
  generatedCode: string;
  themes: Theme[];
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
  fileName: string;
  onFileNameChange: (name: string) => void;
  onSave: () => void;
  onSaveAsTemplate?: () => void;
  isSaving: boolean;
  isGenerating?: boolean;
  canSave: boolean;
}

export function GeneratePreviewColumn({
  generatedCode,
  themes,
  selectedTheme,
  onThemeChange,
  fileName,
  onFileNameChange,
  onSave,
  onSaveAsTemplate,
  isSaving,
  isGenerating = false,
  canSave
}: GeneratePreviewColumnProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  // Show loading state during generation
  if (isGenerating) {
    return (
      <s-section heading="Preview">
        <LoadingState
          message="Generating section code..."
          subMessage="This may take 10-15 seconds"
        />
      </s-section>
    );
  }

  // Show empty state if no code generated yet
  if (!generatedCode) {
    return (
      <s-section heading="Preview">
        <EmptyState
          heading="No code yet"
          message="Enter a prompt or choose a template to get started."
          icon="📝"
        />
      </s-section>
    );
  }

  // Show code preview and save controls
  return (
    <>
      {/* Code/Preview with Tabs */}
      <s-section>
        <s-stack gap="base" direction="block">
          <div style={{ display: 'flex', gap: '4px' }}>
            <s-button
              variant={activeTab === 'code' ? 'primary' : 'tertiary'}
              onClick={() => setActiveTab('code')}
            >
              Code
            </s-button>
            <s-button
              variant={activeTab === 'preview' ? 'primary' : 'tertiary'}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </s-button>
          </div>

          {activeTab === 'code' ? (
            <CodePreview code={generatedCode} fileName={fileName} />
          ) : (
            <PreviewErrorBoundary onRetry={() => {}}>
              <SectionPreview liquidCode={generatedCode} />
            </PreviewErrorBoundary>
          )}
        </s-stack>
      </s-section>

      {/* Save Options */}
      <s-section heading="Save to Theme">
        <s-stack gap="large" direction="block">
          <ThemeSelector
            themes={themes}
            selectedThemeId={selectedTheme}
            onChange={onThemeChange}
            disabled={isSaving}
          />
          <SectionNameInput
            value={fileName}
            onChange={onFileNameChange}
            disabled={isSaving}
          />
          <s-stack gap="base" direction="block">
            <s-button
              variant="primary"
              onClick={onSave}
              loading={isSaving || undefined}
              disabled={!canSave || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save to Theme'}
            </s-button>
            {onSaveAsTemplate && (
              <s-button
                variant="secondary"
                onClick={onSaveAsTemplate}
                disabled={!generatedCode || isSaving}
              >
                Save as Template
              </s-button>
            )}
          </s-stack>
        </s-stack>
      </s-section>
    </>
  );
}
```

**Features:**
- Tab switching between Code and Preview views
- Loading/empty state handling
- Theme selector with disability handling
- Filename input validation
- Dual save options (Save to Theme, Save as Template)

#### Form Input Components

##### PromptInput
Textarea with character counter and validation.
```typescript
// File: PromptInput.tsx
export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
  error?: string;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
}

export function PromptInput({
  value,
  onChange,
  placeholder = 'A hero section with a background image and centered text...',
  helpText = 'Describe the section you want to generate in natural language',
  error,
  disabled = false,
  minLength = 10,
  maxLength = 2000
}: PromptInputProps) {
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    onChange(target.value);
  };

  const charCount = value.length;
  const charCountText = `${charCount}/${maxLength} characters`;
  const isValid = charCount === 0 || (charCount >= minLength && charCount <= maxLength);
  const validationError = !isValid
    ? `Prompt must be between ${minLength} and ${maxLength} characters`
    : undefined;

  const displayDetails = !error && !validationError
    ? `${helpText} (${charCountText})`
    : charCountText;

  return (
    <s-text-area
      label="Prompt"
      value={value}
      onInput={handleInput}
      placeholder={placeholder}
      disabled={disabled || undefined}
      rows={6}
      maxLength={maxLength}
      error={error || validationError}
      details={displayDetails}
    />
  );
}
```

**Validation:** Min 10, max 2000 characters

##### ThemeSelector
Dropdown for theme selection with role indicators.
```typescript
// File: ThemeSelector.tsx
export interface ThemeSelectorProps {
  themes: Theme[];
  selectedThemeId: string;
  onChange: (themeId: string) => void;
  disabled?: boolean;
}

export function ThemeSelector({
  themes,
  selectedThemeId,
  onChange,
  disabled = false
}: ThemeSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label htmlFor="theme-selector" style={{ /* styles */ }}>
        Select Theme
      </label>
      <select
        id="theme-selector"
        value={selectedThemeId}
        onChange={handleChange}
        disabled={disabled}
        style={{ /* custom dropdown styling */ }}
      >
        {themes.length === 0 ? (
          <option value="">No themes available</option>
        ) : (
          themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name} {theme.role === 'MAIN' ? '(Live)' : `(${theme.role})`}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
```

**Note:** Uses native `<select>` instead of `s-select` due to dynamic option rendering issues.

#### Display Components

##### CodePreview
Code display with copy and download buttons.
```typescript
// File: CodePreview.tsx
export interface CodePreviewProps {
  code: string;
  maxHeight?: string;
  fileName?: string;
  onCopy?: () => void;
  onDownload?: () => void;
}

export function CodePreview({
  code,
  maxHeight = '400px',
  fileName = 'section',
  onCopy,
  onDownload
}: CodePreviewProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!code) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      onCopy?.();
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9-_]/g, '-');
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizedName}.liquid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  return (
    <s-stack gap="base" direction="block">
      <s-stack gap="small" direction="inline" justifyContent="end">
        <s-button
          onClick={handleCopy}
          variant="secondary"
          icon={copySuccess ? 'check' : 'clipboard'}
        >
          {copySuccess ? 'Copied!' : 'Copy'}
        </s-button>
        <s-button
          onClick={handleDownload}
          variant="secondary"
          icon="download"
        >
          Download
        </s-button>
      </s-stack>

      <s-box padding="base" background="subdued" borderRadius="base">
        <pre
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight,
            margin: 0,
            fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {code}
        </pre>
      </s-box>
    </s-stack>
  );
}
```

**Features:**
- Copy to clipboard with success feedback
- Download as .liquid file
- Syntax-highlighted code in monospace font
- Scrollable container with max-height

##### SaveTemplateModal
Modal for saving generated code as template.
```typescript
// File: SaveTemplateModal.tsx
export interface SaveTemplateModalProps {
  defaultPrompt: string;
  onSave: (data: {
    title: string;
    description: string;
    category: string;
    icon: string;
    prompt: string;
  }) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "marketing", label: "Marketing" },
  { value: "product", label: "Product" },
  { value: "content", label: "Content" },
  { value: "layout", label: "Layout" },
];

const ICONS = ["📋", "🎨", "📦", "📝", "🛒", "⭐", "🔥", "💡", "🎯", "🚀"];

export function SaveTemplateModal({
  defaultPrompt,
  onSave,
  onClose
}: SaveTemplateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("marketing");
  const [icon, setIcon] = useState("📋");
  const [prompt, setPrompt] = useState(defaultPrompt);

  const isValid = title.trim() && description.trim() && prompt.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      icon,
      prompt: prompt.trim(),
    });
  };

  return (
    <div style={{ /* modal overlay */ }}>
      <div role="dialog" aria-modal="true">
        <s-section>
          <s-stack gap="large" direction="block">
            {/* Header */}
            <s-stack gap="small" direction="inline" justifyContent="space-between">
              <s-text id="save-template-title" type="strong">
                Save as Template
              </s-text>
              <s-button variant="tertiary" onClick={onClose}>
                ✕
              </s-button>
            </s-stack>

            {/* Form Fields */}
            <s-stack gap="large" direction="block">
              <input type="text" placeholder="e.g., Hero Banner" />
              <input type="text" placeholder="Brief description" />
              <select>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <s-stack gap="small">
                {ICONS.map((emoji) => (
                  <button key={emoji} type="button" style={{ /* selected style */ }}>
                    {emoji}
                  </button>
                ))}
              </s-stack>
              <textarea rows={3} placeholder="Prompt" />
            </s-stack>

            {/* Actions */}
            <s-stack gap="small" alignItems="end">
              <s-button variant="secondary" onClick={onClose}>
                Cancel
              </s-button>
              <s-button
                variant="primary"
                onClick={handleSubmit}
                disabled={!isValid}
              >
                Save Template
              </s-button>
            </s-stack>
          </s-stack>
        </s-section>
      </div>
    </div>
  );
}
```

**Features:**
- Reusable modal overlay pattern
- Form validation (all fields required)
- Category selection
- Emoji icon picker
- Accessible dialog (role, aria-modal, aria-labelledby)

### Component Composition Pattern
Main route (GeneratePage) composes layout and sub-components:
```
GeneratePage
├── GenerateLayout
│   ├── GenerateInputColumn
│   │   ├── PromptInput
│   │   ├── AdvancedOptions
│   │   ├── TemplateSuggestions
│   │   └── PromptExamples
│   └── GeneratePreviewColumn
│       ├── LoadingState / EmptyState / (CodePreview + ThemeSelector + SectionNameInput)
│       ├── CodePreview
│       ├── ThemeSelector
│       ├── SectionNameInput
│       └── Save Buttons
└── SaveTemplateModal
```

---

## 4. TYPE DEFINITIONS

### File: /Users/lmtnolimit/working/ai-section-generator/app/types/

#### shopify-api.types.ts
Shopify GraphQL API types (Theme, ThemeFile, etc.)

#### service.types.ts
```typescript
// AI Service Types
export interface AIGenerationOptions {
  prompt: string;
  model?: string;
  temperature?: number;
}

export interface AIGenerationResult {
  code: string;
  prompt: string;
  modelUsed: string;
  timestamp: Date;
}

export interface AIServiceInterface {
  generateSection(prompt: string): Promise<string>;
  getMockSection(prompt: string): string;
}

// Theme Service Types
export interface ThemeServiceInterface {
  getThemes(request: Request): Promise<Theme[]>;
  createSection(
    request: Request,
    themeId: string,
    fileName: string,
    content: string
  ): Promise<ThemeFileMetadata>;
}

// Database Types
export interface GeneratedSectionRecord {
  id: string;
  shop: string;
  prompt: string;
  content: string;
  createdAt: Date;
}

// Action Data Types for Routes
export interface GenerateActionData {
  success?: boolean;
  code?: string;
  prompt?: string;
  message?: string;
  historyId?: string;
  error?: string;
  quota?: QuotaCheck;
}

export interface SaveActionData {
  success: boolean;
  message: string;
}
```

#### index.ts
Central export for all types.

---

## 5. POLARIS WEB COMPONENTS PATTERNS

### Core Components Used

#### Layout
- `<s-page>` - Page container with heading and primary action
- `<s-section>` - Section container with heading
- `<s-stack>` - Flexbox stack with gap and direction
- `<s-grid>` - CSS Grid container
- `<s-box>` - Padded box with background

#### Forms
- `<s-text-area>` - Multi-line input with label, validation, details
- `<s-button>` - Button with variants (primary, secondary, tertiary), loading, disabled
- `<s-button-group>` - Group of buttons
- `<s-text-field>` - Single-line input

#### Feedback
- `<s-banner>` - Alert banner with tone (success, critical, warning), dismissible
- `<s-text>` - Text with variants (headingMd, strong), color (subdued)

#### Props Patterns
```typescript
// Buttons
<s-button
  variant="primary" | "secondary" | "tertiary"
  onClick={handler}
  loading={isLoading || undefined}  // Only pass if true
  disabled={isDisabled}
  icon="icon-name"
>
  Button Text
</s-button>

// Banners
<s-banner tone="success" | "critical" | "warning" dismissible>
  Message
</s-banner>

// Text areas
<s-text-area
  label="Label"
  value={value}
  onInput={handler}
  placeholder="..."
  rows={6}
  maxLength={2000}
  error={errorText}  // undefined if no error
  details={detailsText}
  disabled={isDisabled || undefined}
/>

// Stack/Grid
<s-stack gap="large" | "base" | "small" direction="block" | "inline">
  {children}
</s-stack>

// Page
<s-page heading="Title" inlineSize="base" | "large">
  <s-button slot="primary-action">Action</s-button>
  {children}
  <s-section slot="aside">Aside</s-section>
</s-page>
```

### Styling Patterns
- Polaris variables: `var(--p-color-bg-surface)`, `var(--p-color-border)`
- Inline styles for custom layouts (ThemeSelector, SaveTemplateModal)
- Monospace font for code: `ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace`

---

## 6. CODE STANDARDS SUMMARY

### TypeScript
- Strict mode enabled
- Use `type` imports for types
- Explicit function parameter types
- Define interfaces for objects
- Avoid `any` type
- Export types from service modules

### React Router
- Loader: authenticate → fetch data → return typed object
- Action: validate formData → execute business logic → return typed response
- Component: useLoaderData/useActionData → useState → JSX

### Form Handling
- Use FormData API with useSubmit
- Discriminate actions via `formData.get("action")`
- Return typed response objects
- Show loading state via `navigation.state === "submitting"`

### Services
- Export singleton instances (e.g., `export const historyService = { ... }`)
- Use async/await
- Include try-catch for external APIs
- Provide fallback mechanisms
- Return typed responses
- Validate inputs

### Database (Prisma)
- Use singleton pattern for PrismaClient
- Use type-safe queries (not raw SQL)
- Select only needed fields
- Index frequently queried fields

### Error Handling
- Service layer: try-catch → fallback
- Route layer: try-catch → user-friendly message
- Show errors in banners with tone="critical"

### Security
- Always authenticate routes
- Enforce shop-based access control (where { id, shop })
- Validate and sanitize inputs
- Store API keys in env variables

### Performance
- Use Promise.all() for parallel queries
- Select only needed Prisma fields
- Cache theme list when possible
- Minimize API calls

---

## 7. KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `/app/routes/app.generate.tsx` | Generation page with loader, action, component |
| `/app/routes/app.history.tsx` | History page with filtering and pagination |
| `/app/routes/app._index.tsx` | Home page with onboarding and stats |
| `/app/services/history.server.ts` | History CRUD operations |
| `/app/components/generate/GenerateLayout.tsx` | Two-column layout wrapper |
| `/app/components/generate/GenerateInputColumn.tsx` | Primary column (prompt, templates) |
| `/app/components/generate/GeneratePreviewColumn.tsx` | Secondary column (preview, save) |
| `/app/components/generate/PromptInput.tsx` | Prompt textarea with validation |
| `/app/components/generate/CodePreview.tsx` | Code display with actions |
| `/app/components/generate/ThemeSelector.tsx` | Theme dropdown |
| `/app/components/generate/SaveTemplateModal.tsx` | Template save modal |
| `/app/types/index.ts` | Central type exports |
| `/app/types/service.types.ts` | Service interfaces |
| `/docs/code-standards.md` | Comprehensive style guide |

---

## 8. UNRESOLVED QUESTIONS

- Design guidelines document (docs/design-guidelines.md) not found - referenced in scout but doesn't exist
- Should design guidelines be created to document Polaris patterns and styling conventions?

