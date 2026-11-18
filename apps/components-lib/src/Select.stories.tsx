import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    helperText: { control: 'text' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    unstyled: { control: 'boolean' },
    value: { control: 'text' },
    onChange: { action: 'changed' },
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

export const Default: Story = {
  args: {
    label: 'Fruit',
    options,
    value: 'apple',
  },
};

export const WithPlaceholder: Story = {
  args: {
    label: 'Fruit',
    placeholder: 'Select a fruit',
    options,
    value: '',
  },
};

export const WithError: Story = {
  args: {
    label: 'Fruit',
    options,
    value: '',
    error: 'Please select a fruit',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Fruit',
    options,
    value: 'banana',
    helperText: 'Choose your favorite fruit',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Fruit',
    options,
    value: 'apple',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Fruit',
    options,
    value: 'cherry',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const Unstyled: Story = {
  args: {
    label: 'Fruit',
    options,
    value: 'banana',
    unstyled: true,
  },
};