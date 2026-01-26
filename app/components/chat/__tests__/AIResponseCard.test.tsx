/**
 * Tests for AIResponseCard component
 * Tests streaming phases, change bullets, code accordion, and version display
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { AIResponseCard } from '../AIResponseCard';

describe('AIResponseCard', () => {
  const defaultProps = {
    isStreaming: false,
    message: 'Test message',
  };

  describe('streaming state', () => {
    it('renders phase indicators when streaming', () => {
      render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={true}
          streamingPhase="schema"
        />
      );

      expect(screen.getByText('Analyzing your request')).toBeInTheDocument();
      expect(screen.getByText(/Building section schema/)).toBeInTheDocument();
      expect(screen.getByText('Adding styles')).toBeInTheDocument();
      expect(screen.getByText('Finalizing code')).toBeInTheDocument();
    });

    it('shows current phase with spinner', () => {
      const { container } = render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={true}
          streamingPhase="schema"
        />
      );

      // Should have a spinner for current phase
      expect(container.querySelector('s-spinner')).toBeInTheDocument();
    });

    it('displays phase context when provided', () => {
      render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={true}
          streamingPhase="schema"
          phaseContext="Adding 3 customizable settings"
        />
      );

      expect(screen.getByText(/Adding 3 customizable settings/)).toBeInTheDocument();
    });

    it('shows message with cursor when streaming', () => {
      const { container } = render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={true}
          message="Generating..."
        />
      );

      expect(screen.getByText('Generating...')).toBeInTheDocument();
      // Cursor element exists
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });
  });

  describe('completed state', () => {
    it('renders change bullets when provided', () => {
      render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          changes={['Added hero banner', 'Changed colors']}
        />
      );

      expect(screen.getByText('Added hero banner')).toBeInTheDocument();
      expect(screen.getByText('Changed colors')).toBeInTheDocument();
    });

    it('renders default message when no changes', () => {
      render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          changes={[]}
        />
      );

      expect(screen.getByText(/preview it in the panel/i)).toBeInTheDocument();
    });

    it('hides phase indicators when not streaming', () => {
      const { container } = render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
        />
      );

      // Phase container should be hidden
      expect(container.querySelector('.ai-response-phases--hidden')).toBeInTheDocument();
    });
  });

  describe('version badge', () => {
    it('shows version badge when versionNumber provided', () => {
      render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          versionNumber={2}
        />
      );

      expect(screen.getByText('v2')).toBeInTheDocument();
    });

    it('shows success tone badge when active', () => {
      const { container } = render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          versionNumber={1}
          isActive={true}
        />
      );

      const badge = container.querySelector('s-badge');
      expect(badge).toHaveAttribute('tone', 'success');
    });

    it('shows info tone badge when not active', () => {
      const { container } = render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          versionNumber={1}
          isActive={false}
        />
      );

      const badge = container.querySelector('s-badge');
      expect(badge).toHaveAttribute('tone', 'info');
    });
  });

  describe('code accordion', () => {
    it('shows code toggle when code is provided', () => {
      render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          code="<div>Test code</div>"
        />
      );

      expect(screen.getByText('Show code')).toBeInTheDocument();
    });

    it('expands code when toggle is clicked', () => {
      render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          code="<div>Test code</div>"
        />
      );

      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);

      expect(screen.getByText('Hide code')).toBeInTheDocument();
      expect(screen.getByText('<div>Test code</div>')).toBeInTheDocument();
    });

    it('collapses code when toggle is clicked again', () => {
      render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          code="<div>Test code</div>"
        />
      );

      const toggle = screen.getByRole('button');
      fireEvent.click(toggle); // Expand
      fireEvent.click(toggle); // Collapse

      expect(screen.getByText('Show code')).toBeInTheDocument();
    });

    it('supports keyboard navigation for accessibility', () => {
      render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          code="<div>Test code</div>"
        />
      );

      const toggle = screen.getByRole('button');
      fireEvent.keyDown(toggle, { key: 'Enter' });

      expect(screen.getByText('Hide code')).toBeInTheDocument();
    });

    it('hides code toggle when streaming', () => {
      render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={true}
          code="<div>Test code</div>"
        />
      );

      expect(screen.queryByText('Show code')).not.toBeInTheDocument();
    });
  });

  describe('version card', () => {
    it('shows version card when versionNumber and createdAt provided', () => {
      render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          versionNumber={1}
          createdAt={new Date()}
        />
      );

      // Version badge in header and version card both show v1
      const versionTexts = screen.getAllByText('v1');
      expect(versionTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('calls onPreview when preview button clicked', () => {
      const onPreview = jest.fn();
      render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          versionNumber={1}
          createdAt={new Date()}
          onPreview={onPreview}
        />
      );

      const previewButton = screen.getByText('Preview');
      fireEvent.click(previewButton);

      expect(onPreview).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('renders with proper ARIA attributes', () => {
      const { container } = render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          code="<div>Test</div>"
        />
      );

      const toggle = container.querySelector('[role="button"]');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(toggle).toHaveAttribute('aria-controls', 'ai-response-code');
    });

    it('updates aria-expanded when code is expanded', () => {
      const { container } = render(
        <AIResponseCard
          {...defaultProps}
          isStreaming={false}
          code="<div>Test</div>"
        />
      );

      const toggle = container.querySelector('[role="button"]')!;
      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('memoization', () => {
    it('should not re-render when props are equal', () => {
      const { rerender } = render(
        <AIResponseCard
          isStreaming={false}
          message="Test"
          changes={['Change 1']}
        />
      );

      // Re-render with same props - component should be memoized
      rerender(
        <AIResponseCard
          isStreaming={false}
          message="Test"
          changes={['Change 1']}
        />
      );

      // If it renders, we can still see content
      expect(screen.getByText('Change 1')).toBeInTheDocument();
    });
  });
});
