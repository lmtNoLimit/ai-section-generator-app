/**
 * Tests for RestoreMessage component
 * Verifies restore confirmation message display
 */
import { render, screen } from '@testing-library/react';
import { RestoreMessage } from '../RestoreMessage';

describe('RestoreMessage', () => {
  it('renders restore confirmation with version numbers', () => {
    render(
      <RestoreMessage
        restoredFromVersion={2}
        newVersion={4}
        timestamp={new Date()}
      />
    );

    expect(screen.getByText(/Restored to version 2 as v4/i)).toBeInTheDocument();
  });

  it('shows relative time for recent timestamps', () => {
    const now = new Date();
    render(
      <RestoreMessage
        restoredFromVersion={1}
        newVersion={3}
        timestamp={now}
      />
    );

    expect(screen.getByText(/just now/i)).toBeInTheDocument();
  });

  it('shows minutes ago for older timestamps', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    render(
      <RestoreMessage
        restoredFromVersion={1}
        newVersion={2}
        timestamp={fiveMinutesAgo}
      />
    );

    expect(screen.getByText(/5 min ago/i)).toBeInTheDocument();
  });
});
