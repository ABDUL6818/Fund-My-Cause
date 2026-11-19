import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    a11y: {
      config: {
        rules: [
          { id: 'label', enabled: true },
          { id: 'color-contrast', enabled: true },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    rows: { control: { type: 'number', min: 1, max: 20 } },
    fullWidth: { control: 'boolean' },
    unstyled: { control: 'boolean' },
    required: { control: 'boolean' },
    value: { control: 'text' },
    onChange: { action: 'changed' },
  },
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description',
    rows: 4,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description',
    helperText: 'Provide a short summary of your campaign.',
    rows: 4,
  },
};

export const WithError: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description',
    error: 'Description is required.',
    rows: 4,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description',
    value: 'This textarea is disabled.',
    disabled: true,
    rows: 4,
  },
};

export const Required: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description',
    required: true,
    rows: 4,
  },
};

export const CustomRows: Story = {
  args: {
    label: 'Notes',
    placeholder: 'Enter your notes',
    rows: 8,
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description',
    fullWidth: true,
    rows: 4,
  },
  parameters: {
    layout: 'padded',
  },
};

export const Unstyled: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description',
    unstyled: true,
    rows: 4,
  },
};

export const WithValue: Story = {
  args: {
    label: 'Description',
    value: 'A pre-filled description for the campaign.',
    rows: 4,
  },
};