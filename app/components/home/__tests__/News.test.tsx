/**
 * Tests for News component
 * Tests empty state, rendering items, "See all" expansion, date formatting,
 * and badge tone assignment based on news type
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { NewsItem } from '../../../types/dashboard.types';
import { News } from '../News';

describe('News', () => {
  describe('empty state', () => {
    it('renders empty state when no news items', () => {
      const { container } = render(<News items={[]} />);

      expect(screen.getByText('No news at the moment')).toBeInTheDocument();
      // The heading is passed as an attribute to s-section
      const section = container.querySelector('s-section[heading="News"]');
      expect(section).toBeInTheDocument();
    });

    it('displays megaphone icon in empty state', () => {
      const { container } = render(<News items={[]} />);

      const icon = container.querySelector('s-icon[type="megaphone"]');
      expect(icon).toBeInTheDocument();
    });

    it('shows empty state with subdued styling', () => {
      const { container } = render(<News items={[]} />);

      const box = container.querySelector(
        's-box[background="subdued"][border="base"][borderRadius="base"][padding="large"]'
      );
      expect(box).toBeInTheDocument();
    });
  });

  describe('rendering items', () => {
    const mockNews: NewsItem[] = [
      {
        id: '1',
        title: 'New feature released',
        description: 'Check out our latest feature',
        type: 'feature',
        publishedAt: new Date('2025-12-16'),
      },
      {
        id: '2',
        title: 'Important update',
        description: 'System maintenance scheduled',
        type: 'announcement',
        publishedAt: new Date('2025-12-15'),
      },
      {
        id: '3',
        title: 'General update',
        description: 'Minor improvements and bug fixes',
        type: 'update',
        publishedAt: new Date('2025-12-14'),
      },
    ];

    it('renders all items when less than maxItems', () => {
      render(<News items={mockNews.slice(0, 2)} />);

      expect(screen.getByText('New feature released')).toBeInTheDocument();
      expect(screen.getByText('Important update')).toBeInTheDocument();
    });

    it('renders titles for all items', () => {
      render(<News items={mockNews} />);

      expect(screen.getByText('New feature released')).toBeInTheDocument();
      expect(screen.getByText('Important update')).toBeInTheDocument();
      expect(screen.getByText('General update')).toBeInTheDocument();
    });

    it('renders descriptions for all items', () => {
      render(<News items={mockNews} />);

      expect(
        screen.getByText('Check out our latest feature')
      ).toBeInTheDocument();
      expect(
        screen.getByText('System maintenance scheduled')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Minor improvements and bug fixes')
      ).toBeInTheDocument();
    });

    it('respects maxItems prop to limit visible items', () => {
      render(<News items={mockNews} maxItems={2} />);

      // Should show first 2 items
      expect(screen.getByText('New feature released')).toBeInTheDocument();
      expect(screen.getByText('Important update')).toBeInTheDocument();

      // Should not show 3rd item initially
      expect(screen.queryByText('General update')).not.toBeInTheDocument();
    });

    it('shows dividers between items', () => {
      const { container } = render(<News items={mockNews.slice(0, 2)} />);

      const dividers = container.querySelectorAll('s-divider');
      // Should have 1 divider between 2 items
      expect(dividers.length).toBe(1);
    });

    it('does not show divider after last item', () => {
      const { container } = render(<News items={mockNews.slice(0, 1)} />);

      const dividers = container.querySelectorAll('s-divider');
      // Single item should have no dividers
      expect(dividers.length).toBe(0);
    });
  });

  describe('"See all" expansion', () => {
    const mockNews: NewsItem[] = [
      {
        id: '1',
        title: 'Item 1',
        description: 'Description 1',
        type: 'feature',
        publishedAt: new Date('2025-12-16'),
      },
      {
        id: '2',
        title: 'Item 2',
        description: 'Description 2',
        type: 'announcement',
        publishedAt: new Date('2025-12-15'),
      },
      {
        id: '3',
        title: 'Item 3',
        description: 'Description 3',
        type: 'update',
        publishedAt: new Date('2025-12-14'),
      },
      {
        id: '4',
        title: 'Item 4',
        description: 'Description 4',
        type: 'feature',
        publishedAt: new Date('2025-12-13'),
      },
    ];

    it('shows "See all" button when items exceed maxItems', () => {
      render(<News items={mockNews} maxItems={2} />);

      expect(screen.getByText('See all (4)')).toBeInTheDocument();
    });

    it('does not show "See all" button when items equal maxItems', () => {
      render(<News items={mockNews.slice(0, 3)} maxItems={3} />);

      expect(screen.queryByText(/See all/)).not.toBeInTheDocument();
    });

    it('does not show "See all" button when items less than maxItems', () => {
      render(<News items={mockNews.slice(0, 2)} maxItems={3} />);

      expect(screen.queryByText(/See all/)).not.toBeInTheDocument();
    });

    it('expands to show all items when "See all" clicked', async () => {
      const user = userEvent.setup();
      render(<News items={mockNews} maxItems={2} />);

      // Initially should not show all items
      expect(screen.queryByText('Item 3')).not.toBeInTheDocument();
      expect(screen.queryByText('Item 4')).not.toBeInTheDocument();

      // Click "See all" button
      const seeAllButton = screen.getByText('See all (4)');
      await user.click(seeAllButton);

      // Now all items should be visible
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
      expect(screen.getByText('Item 4')).toBeInTheDocument();
    });

    it('changes button text to "Show less" when expanded', async () => {
      const user = userEvent.setup();
      render(<News items={mockNews} maxItems={2} />);

      const seeAllButton = screen.getByText('See all (4)');
      await user.click(seeAllButton);

      expect(screen.getByText('Show less')).toBeInTheDocument();
      expect(screen.queryByText('See all (4)')).not.toBeInTheDocument();
    });

    it('collapses back to maxItems when "Show less" clicked', async () => {
      const user = userEvent.setup();
      render(<News items={mockNews} maxItems={2} />);

      // Expand
      const seeAllButton = screen.getByText('See all (4)');
      await user.click(seeAllButton);

      // All items visible
      expect(screen.getByText('Item 4')).toBeInTheDocument();

      // Collapse
      const showLessButton = screen.getByText('Show less');
      await user.click(showLessButton);

      // Only first 2 items should be visible
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.queryByText('Item 3')).not.toBeInTheDocument();
      expect(screen.queryByText('Item 4')).not.toBeInTheDocument();
    });
  });

  describe('date formatting', () => {
    it('formats today as "Today"', () => {
      // Create a date that represents "today"
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockNews: NewsItem[] = [
        {
          id: 'date-today',
          title: 'Today news',
          description: 'Published today',
          type: 'feature',
          publishedAt: today,
        },
      ];

      render(<News items={mockNews} />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('formats yesterday as "Yesterday"', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const mockNews: NewsItem[] = [
        {
          id: 'date-yesterday',
          title: 'Yesterday news',
          description: 'Published yesterday',
          type: 'feature',
          publishedAt: yesterday,
        },
      ];

      render(<News items={mockNews} />);
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
    });

    it('formats days ago correctly', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      fiveDaysAgo.setHours(0, 0, 0, 0);

      const mockNews: NewsItem[] = [
        {
          id: 'date-5days',
          title: 'News from 5 days ago',
          description: 'Old news',
          type: 'feature',
          publishedAt: fiveDaysAgo,
        },
      ];

      render(<News items={mockNews} />);
      expect(screen.getByText('5 days ago')).toBeInTheDocument();
    });

    it('formats weeks ago correctly', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      twoWeeksAgo.setHours(0, 0, 0, 0);

      const mockNews: NewsItem[] = [
        {
          id: 'date-2weeks',
          title: 'News from 2 weeks ago',
          description: 'Old news',
          type: 'feature',
          publishedAt: twoWeeksAgo,
        },
      ];

      render(<News items={mockNews} />);
      expect(screen.getByText('2 weeks ago')).toBeInTheDocument();
    });

    it('formats month and day for older dates', () => {
      const oldDate = new Date();
      // Set to 60 days ago to ensure it's in previous month format
      oldDate.setDate(oldDate.getDate() - 60);
      oldDate.setHours(0, 0, 0, 0);

      const mockNews: NewsItem[] = [
        {
          id: 'date-old',
          title: 'Old news',
          description: 'From previous month',
          type: 'feature',
          publishedAt: oldDate,
        },
      ];

      render(<News items={mockNews} />);

      // The date should be formatted as month + day (e.g., "Oct 15")
      // We check that it does NOT show "days ago" or "weeks ago"
      const dateText = screen.getByText(/^[A-Z][a-z]{2} \d{1,2}$/);
      expect(dateText).toBeInTheDocument();
    });
  });

  describe('badge tone assignment', () => {
    const createNewsItem = (
      type: NewsItem['type'],
      id: string
    ): NewsItem => ({
      id,
      title: `${type} item`,
      description: 'Test description',
      type,
      publishedAt: new Date(),
    });

    it('shows "New" badge with success tone for feature type', () => {
      const mockNews: NewsItem[] = [createNewsItem('feature', 'badge-feature')];
      const { container } = render(<News items={mockNews} />);

      const badge = container.querySelector('s-badge[tone="success"]');
      expect(badge).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('shows "Important" badge with caution tone for announcement type', () => {
      const mockNews: NewsItem[] = [
        createNewsItem('announcement', 'badge-announcement'),
      ];
      const { container } = render(<News items={mockNews} />);

      const badge = container.querySelector('s-badge[tone="caution"]');
      expect(badge).toBeInTheDocument();
      expect(screen.getByText('Important')).toBeInTheDocument();
    });

    it('shows "Update" badge with info tone for update type', () => {
      const mockNews: NewsItem[] = [createNewsItem('update', 'badge-update')];
      const { container } = render(<News items={mockNews} />);

      const badge = container.querySelector('s-badge[tone="info"]');
      expect(badge).toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('displays correct badge for all news types simultaneously', () => {
      const mockNews: NewsItem[] = [
        createNewsItem('feature', 'all-feature'),
        createNewsItem('announcement', 'all-announcement'),
        createNewsItem('update', 'all-update'),
      ];

      const { container } = render(<News items={mockNews} maxItems={10} />);

      const badges = container.querySelectorAll('s-badge');
      expect(badges.length).toBe(3);

      // One of each tone
      expect(container.querySelector('s-badge[tone="success"]')).toBeInTheDocument();
      expect(
        container.querySelector('s-badge[tone="caution"]')
      ).toBeInTheDocument();
      expect(container.querySelector('s-badge[tone="info"]')).toBeInTheDocument();
    });
  });

  describe('links in titles', () => {
    it('renders title as link when url is provided', () => {
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Click here for more info',
          description: 'Read more',
          url: 'https://example.com',
          type: 'feature',
          publishedAt: new Date(),
        },
      ];

      const { container } = render(<News items={mockNews} />);

      const link = container.querySelector('s-link[href="https://example.com"]');
      expect(link).toBeInTheDocument();
      expect(screen.getByText('Click here for more info')).toBeInTheDocument();
    });

    it('renders title as plain text when no url provided', () => {
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Plain text title',
          description: 'No link',
          type: 'feature',
          publishedAt: new Date(),
        },
      ];

      const { container } = render(<News items={mockNews} />);

      const link = container.querySelector('s-link');
      expect(link).not.toBeInTheDocument();
      expect(screen.getByText('Plain text title')).toBeInTheDocument();
    });

    it('opens link in new tab when url provided', () => {
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'External link',
          description: 'Opens in new tab',
          url: 'https://example.com',
          type: 'feature',
          publishedAt: new Date(),
        },
      ];

      const { container } = render(<News items={mockNews} />);

      const link = container.querySelector('s-link[target="_blank"]');
      expect(link).toBeInTheDocument();
    });

    it('handles mixed items with and without urls', () => {
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'With link',
          description: 'Has URL',
          url: 'https://example.com',
          type: 'feature',
          publishedAt: new Date(),
        },
        {
          id: '2',
          title: 'Without link',
          description: 'No URL',
          type: 'update',
          publishedAt: new Date(),
        },
      ];

      const { container } = render(<News items={mockNews} />);

      const links = container.querySelectorAll('s-link');
      expect(links.length).toBe(1);

      expect(screen.getByText('With link')).toBeInTheDocument();
      expect(screen.getByText('Without link')).toBeInTheDocument();
    });
  });

  describe('header and navigation', () => {
    const mockNews: NewsItem[] = [
      {
        id: '1',
        title: 'Test news',
        description: 'Test description',
        type: 'feature',
        publishedAt: new Date(),
      },
    ];

    it('renders "News & Updates" heading', () => {
      render(<News items={mockNews} />);

      expect(screen.getByText('News & Updates')).toBeInTheDocument();
    });

    it('renders heading with proper structure', () => {
      const { container } = render(<News items={mockNews} />);

      const heading = container.querySelector('s-heading');
      expect(heading?.textContent).toContain('News & Updates');
    });

    it('renders section element', () => {
      const { container } = render(<News items={mockNews} />);

      const section = container.querySelector('s-section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('default maxItems behavior', () => {
    const createManyItems = (count: number): NewsItem[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: String(i + 1),
        title: `Item ${i + 1}`,
        description: `Description ${i + 1}`,
        type: 'update' as const,
        publishedAt: new Date(),
      }));
    };

    it('defaults to showing 3 items when maxItems not specified', () => {
      const mockNews = createManyItems(5);
      render(<News items={mockNews} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
      expect(screen.queryByText('Item 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Item 5')).not.toBeInTheDocument();
    });

    it('shows all items when maxItems is large enough', () => {
      const mockNews = createManyItems(3);
      render(<News items={mockNews} maxItems={10} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
      expect(screen.queryByText(/See all/)).not.toBeInTheDocument();
    });
  });
});
