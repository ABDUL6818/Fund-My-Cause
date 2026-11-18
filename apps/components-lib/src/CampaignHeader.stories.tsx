import type { Meta, StoryObj } from '@storybook/react';
import { CampaignHeader } from './CampaignHeader';

const meta: Meta<typeof CampaignHeader> = {
  title: 'Components/CampaignHeader',
  component: CampaignHeader,
  parameters: {
    layout: 'fullscreen',
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'heading-order', enabled: true },
          { id: 'image-alt', enabled: true },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    headingLevel: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
    loading: { control: 'boolean' },
    error: { control: 'text' },
    overlay: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof CampaignHeader>;

const sampleImage = 'https://picsum.photos/seed/campaign/1200/400';

export const Default: Story = {
  args: {
    title: 'Spring Fundraiser',
    meta: 'Ends May 31, 2025',
    actions: <button type="button">Donate now</button>,
    image: sampleImage,
    imageAlt: 'Spring flowers in a field',
  },
};

export const TitleOnly: Story = {
  args: {
    title: 'Community Cleanup',
  },
};

export const WithMeta: Story = {
  args: {
    title: 'Community Cleanup',
    meta: 'Starts June 1, 2025 · 12 volunteers',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Community Cleanup',
    actions: (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button">Join</button>
        <button type="button">Share</button>
      </div>
    ),
  },
};

export const FullComposition: Story = {
  args: {
    title: 'Spring Fundraiser',
    meta: 'Ends May 31, 2025 · Goal $10,000',
    actions: (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button">Donate now</button>
        <button type="button">Learn more</button>
      </div>
    ),
    image: sampleImage,
    imageAlt: 'Spring flowers in a field',
  },
};

export const ImageFallback: Story = {
  args: {
    title: 'No Image Campaign',
    meta: 'Image unavailable',
    image: undefined,
  },
};

export const BrokenImage: Story = {
  args: {
    title: 'Broken Image Campaign',
    meta: 'Fallback should render',
    image: 'https://invalid.example.com/missing.png',
    imageAlt: 'Missing image',
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading Campaign',
    loading: true,
  },
};

export const Error: Story = {
  args: {
    title: 'Error Campaign',
    error: 'Unable to load campaign details.',
  },
};

export const Overlay: Story = {
  args: {
    title: 'Overlay Campaign',
    meta: 'Text over image',
    image: sampleImage,
    imageAlt: 'Spring flowers in a field',
    overlay: true,
  },
};

export const HeadingLevelH1: Story = {
  args: {
    title: 'Page Heading',
    headingLevel: 'h1',
  },
};

export const HeadingLevelH2: Story = {
  args: {
    title: 'Section Heading',
    headingLevel: 'h2',
  },
};

export const HeadingLevelH3: Story = {
  args: {
    title: 'Subsection Heading',
    headingLevel: 'h3',
  },
};

export const CustomRenderImage: Story = {
  args: {
    title: 'Custom Image Render',
    meta: 'Uses renderImage',
    renderImage: () => (
      <div
        role="img"
        aria-label="Custom campaign illustration"
        style={{
          width: '100%',
          height: '200px',
          background: 'linear-gradient(135deg, #6a11cb, #2575fc)',
        }}
      />
    ),
  },
};

export const CustomRenderTitle: Story = {
  args: {
    title: 'Custom Title Render',
    meta: 'Uses renderTitle',
    renderTitle: (title) => (
      <span style={{ fontStyle: 'italic', color: '#2575fc' }}>{title}</span>
    ),
  },
};

export const CustomRenderers: Story = {
  args: {
    title: 'Fully Customized',
    meta: 'Both renderers provided',
    renderTitle: (title) => <strong>{title}</strong>,
    renderImage: () => (
      <div
        role="img"
        aria-label="Custom campaign illustration"
        style={{
          width: '100%',
          height: '200px',
          background: 'linear-gradient(135deg, #11998e, #38ef7d)',
        }}
      />
    ),
  },
};