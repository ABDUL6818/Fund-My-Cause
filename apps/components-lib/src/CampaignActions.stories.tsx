import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import CampaignActions from './CampaignActions';

const meta: Meta<typeof CampaignActions> = {
  title: 'Components/CampaignActions',
  component: CampaignActions,
  parameters: {
    layout: 'centered',
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'link-name', enabled: true },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    layout: {
      control: 'select',
      options: ['inline', 'stacked'],
      description: 'Layout orientation of the action buttons',
    },
    saved: {
      control: 'boolean',
      description: 'Whether the campaign is currently saved',
    },
    loading: {
      control: 'boolean',
      description: 'Whether an action is in progress',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    unstyled: {
      control: 'boolean',
      description: 'Render without default styling',
    },
  },
  args: {
    onShare: fn(),
    onSave: fn(),
    onDonate: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof CampaignActions>;

export const Inline: Story = {
  args: {
    layout: 'inline',
    saved: false,
    loading: false,
  },
};

export const Stacked: Story = {
  args: {
    layout: 'stacked',
    saved: false,
    loading: false,
  },
};

export const Saved: Story = {
  args: {
    layout: 'inline',
    saved: true,
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    layout: 'inline',
    saved: false,
    loading: true,
  },
};

export const WithError: Story = {
  args: {
    layout: 'inline',
    saved: false,
    loading: false,
    error: 'Unable to complete the action. Please try again.',
  },
};

export const Unstyled: Story = {
  args: {
    layout: 'inline',
    saved: false,
    loading: false,
    unstyled: true,
  },
};

export const StackedSaved: Story = {
  args: {
    layout: 'stacked',
    saved: true,
    loading: false,
  },
};

export const StackedLoading: Story = {
  args: {
    layout: 'stacked',
    saved: false,
    loading: true,
  },
};

export const StackedWithError: Story = {
  args: {
    layout: 'stacked',
    saved: false,
    loading: false,
    error: 'Something went wrong while saving this campaign.',
  },
};

export const StackedUnstyled: Story = {
  args: {
    layout: 'stacked',
    saved: false,
    loading: false,
    unstyled: true,
  },
};