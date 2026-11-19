import React from 'react';

export interface CampaignListSkeletonProps {
  /** Number of card placeholders to render. Defaults to 6. */
  cardCount?: number;
  /** Optional accessible label for the loading region. */
  ariaLabel?: string;
  /** Optional additional class names for the root element. */
  className?: string;
}

const Block: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = 16, borderRadius = 4, className, style }) => (
  <div
    className={className}
    style={{
      width,
      height,
      borderRadius,
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
      animation: 'campaign-skeleton-shimmer 1.4s ease-in-out infinite',
      ...style,
    }}
  />
);

const shimmerKeyframes = `
@keyframes campaign-skeleton-shimmer {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
`;

const CampaignListSkeleton: React.FC<CampaignListSkeletonProps> = ({
  cardCount = 6,
  ariaLabel = 'Loading campaigns',
  className,
}) => {
  const safeCardCount = Math.max(0, Math.floor(cardCount));

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
      data-testid="campaign-list-skeleton"
    >
      <style>{shimmerKeyframes}</style>

      {/* Header */}
      <div
        data-testid="campaign-list-skeleton-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Block width={220} height={28} borderRadius={6} />
          <Block width={320} height={14} />
        </div>
        <Block width={120} height={36} borderRadius={8} />
      </div>

      {/* Filter bar */}
      <div
        data-testid="campaign-list-skeleton-filters"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <Block width={200} height={36} borderRadius={8} />
        <Block width={140} height={36} borderRadius={8} />
        <Block width={140} height={36} borderRadius={8} />
        <Block width={100} height={36} borderRadius={8} />
      </div>

      {/* Card grid */}
      <div
        data-testid="campaign-list-skeleton-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {Array.from({ length: safeCardCount }).map((_, index) => (
          <div
            key={index}
            data-testid="campaign-list-skeleton-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 16,
              borderRadius: 12,
              border: '1px solid rgba(0, 0, 0, 0.08)',
              backgroundColor: '#fff',
            }}
          >
            <Block width="100%" height={140} borderRadius={8} />
            <Block width="70%" height={20} borderRadius={6} />
            <Block width="100%" height={14} />
            <Block width="85%" height={14} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 4,
              }}
            >
              <Block width={90} height={28} borderRadius={14} />
              <Block width={80} height={32} borderRadius={8} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignListSkeleton;
```

```ts
export { default } from './CampaignListSkeleton';
export { default as CampaignListSkeleton } from './CampaignListSkeleton';
export type { CampaignListSkeletonProps } from './CampaignListSkeleton';
```

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import CampaignListSkeleton from './CampaignListSkeleton';

describe('CampaignListSkeleton', () => {
  it('renders the skeleton root with accessibility attributes', () => {
    render(<CampaignListSkeleton />);

    const root = screen.getByTestId('campaign-list-skeleton');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-live', 'polite');
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(root).toHaveAttribute('aria-label', 'Loading campaigns');
  });

  it('uses a custom aria-label when provided', () => {
    render(<CampaignListSkeleton ariaLabel="Fetching your campaigns" />);

    expect(screen.getByTestId('campaign-list-skeleton')).toHaveAttribute(
      'aria-label',
      'Fetching your campaigns',
    );
  });

  it('renders header, filter bar and grid sections', () => {
    render(<CampaignListSkeleton />);

    expect(screen.getByTestId('campaign-list-skeleton-header')).toBeInTheDocument();
    expect(screen.getByTestId('campaign-list-skeleton-filters')).toBeInTheDocument();
    expect(screen.getByTestId('campaign-list-skeleton-grid')).toBeInTheDocument();
  });

  it('renders the default number of card placeholders', () => {
    render(<CampaignListSkeleton />);

    expect(screen.getAllByTestId('campaign-list-skeleton-card')).toHaveLength(6);
  });

  it('renders the requested number of card placeholders', () => {
    render(<CampaignListSkeleton cardCount={3} />);

    expect(screen.getAllByTestId('campaign-list-skeleton-card')).toHaveLength(3);
  });

  it('normalizes invalid card counts', () => {
    const { rerender } = render(<CampaignListSkeleton cardCount={-5} />);
    expect(screen.queryAllByTestId('campaign-list-skeleton-card')).toHaveLength(0);

    rerender(<CampaignListSkeleton cardCount={2.9} />);
    expect(screen.getAllByTestId('campaign-list-skeleton-card')).toHaveLength(2);
  });

  it('applies a custom className to the root element', () => {
    render(<CampaignListSkeleton className="custom-skeleton" />);

    expect(screen.getByTestId('campaign-list-skeleton')).toHaveClass('custom-skeleton');
  });
});