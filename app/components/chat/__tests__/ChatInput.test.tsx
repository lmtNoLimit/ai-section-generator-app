/**
 * Tests for ChatInput component
 * Tests component rendering and basic functionality
 * Note: Polaris Web Components require special handling in tests
 */
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ChatInput } from '../ChatInput';

/**
 * Helper to render ChatInput with Router context
 * PromptEnhancer uses useFetcher which requires Router
 */
function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter(
    [{ path: '/', element: ui }],
    { initialEntries: ['/'] }
  );
  return render(<RouterProvider router={router} />);
}

describe('ChatInput', () => {
  const mockOnSend = jest.fn();
  const mockOnStop = jest.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
    mockOnStop.mockClear();
  });

  describe('rendering', () => {
    it('renders s-text-area element', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
        />
      );

      expect(container.querySelector('s-text-area')).toBeInTheDocument();
    });

    it('renders s-button element', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
        />
      );

      expect(container.querySelector('s-button')).toBeInTheDocument();
    });

    it('renders with default placeholder', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
        />
      );

      const textarea = container.querySelector('s-text-area');
      expect(textarea).toHaveAttribute('placeholder', 'Describe changes to your section...');
    });

    it('renders with custom placeholder', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
          placeholder="Custom placeholder"
        />
      );

      const textarea = container.querySelector('s-text-area');
      expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder');
    });

    it('renders hint text', () => {
      renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
        />
      );

      expect(screen.getByText(/Press Enter to send/)).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables textarea when disabled prop is true', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
          disabled={true}
        />
      );

      const textarea = container.querySelector('s-text-area');
      expect(textarea).toHaveAttribute('disabled');
    });

    it('disables button when disabled prop is true and not streaming', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
          disabled={true}
        />
      );

      // Find button with send icon
      const sendButton = container.querySelector('s-button[icon="send"]');
      expect(sendButton).toHaveAttribute('disabled');
    });
  });

  describe('streaming state', () => {
    it('shows stop-circle icon when streaming', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={true}
        />
      );

      // Find button with stop-circle icon (send/stop button)
      const sendButton = container.querySelector('s-button[icon="stop-circle"]');
      expect(sendButton).toBeInTheDocument();
    });

    it('shows send icon when not streaming', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
        />
      );

      // Find button with send icon
      const sendButton = container.querySelector('s-button[icon="send"]');
      expect(sendButton).toBeInTheDocument();
    });

    it('shows critical tone when streaming', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={true}
        />
      );

      // Find button with critical tone (stop button when streaming)
      const sendButton = container.querySelector('s-button[tone="critical"]');
      expect(sendButton).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessibility label for send button', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
        />
      );

      // Find button with send icon
      const sendButton = container.querySelector('s-button[icon="send"]');
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).toHaveAttribute('accessibilityLabel', 'Send message');
    });

    it('has accessibility label for stop button when streaming', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={true}
        />
      );

      // Find button with stop-circle icon
      const sendButton = container.querySelector('s-button[icon="stop-circle"]');
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).toHaveAttribute('accessibilityLabel', 'Stop generation');
    });
  });

  describe('container structure', () => {
    it('renders with input container wrapper', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
        />
      );

      expect(container.querySelector('.chat-input-container')).toBeInTheDocument();
    });

    it('renders with s-box wrapper', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
        />
      );

      expect(container.querySelector('s-box')).toBeInTheDocument();
    });

    it('renders with nested s-box for text area container', () => {
      const { container } = renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
        />
      );

      // ChatInput uses nested s-box elements for layout
      const boxes = container.querySelectorAll('s-box');
      expect(boxes.length).toBeGreaterThan(1);
    });
  });

  describe('template buttons', () => {
    it('renders quick templates button', () => {
      renderWithRouter(
        <ChatInput
          onSend={mockOnSend}
          isStreaming={false}
        />
      );

      expect(screen.getByText(/Quick templates/)).toBeInTheDocument();
    });
  });
});
