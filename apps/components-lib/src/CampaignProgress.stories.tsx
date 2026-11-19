import type { Meta, StoryObj } from '@storybook/react';
import { CampaignProgress } from './CampaignProgress';

const meta: Meta<typeof CampaignProgress> = {
  title: 'Components/CampaignProgress',
  component: CampaignProgress,
  parameters: {
    layout: 'centered',
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'aria-progressbar-name', enabled: true },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    percent: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress percentage (0-100)',
    },
    animated: {
      control: 'boolean',
      description: 'Whether the progress bar animates',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the component is in a loading state',
    },
    error: {
      control: 'boolean',
      description: 'Whether the component is in an error state',
    },
  },
};

export default meta;

type Story = StoryObj<typeof CampaignProgress>;

export const Default: Story = {
  args: {
    percent: 45,
  },
};

export const Animated: Story = {
  args: {
    percent: 65,
    animated: true,
  },
};

export const CustomRenderBar: Story = {
  args: {
    percent: 50,
    renderBar: ({ percent }) => (
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Custom campaign progress"
        style={{
          width: '100%',
          height: '12px',
          background: '#e5e7eb',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    ),
  },
};

export const Loading: Story = {
  args: {
    percent: 0,
    loading: true,
  },
};

export const Error: Story = {
  args: {
    percent: 0,
    error: true,
  },
};

export const OverFunded: Story = {
  args: {
    percent: 125,
  },
};