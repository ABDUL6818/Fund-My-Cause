import type { Meta, StoryObj } from '@storybook/react';
import { CampaignDetailSkeleton } from './CampaignDetailSkeleton';

const meta: Meta<typeof CampaignDetailSkeleton> = {
  title: 'Components/CampaignDetailSkeleton',
  component: CampaignDetailSkeleton,
  parameters: {
    layout: 'padded',
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes applied to the skeleton container.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof CampaignDetailSkeleton>;

export const Default: Story = {
  args: {},
};

export const WithCustomClassName: Story = {
  args: {
    className: 'max-w-3xl mx-auto',
  },
};