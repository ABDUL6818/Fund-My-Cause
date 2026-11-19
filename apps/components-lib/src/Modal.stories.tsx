import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "./Modal";
import { useState } from "react";

const meta = {
  title: "Components/Modal",
  component: Modal,
  tags: ["autodocs"],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

const ModalWrapper = (args: any) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Open Modal
      </button>
      <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export const Default: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: "Modal Title",
    children: (
      <div className="space-y-4">
        <p>This is the modal content area.</p>
        <p>You can place any content here.</p>
      </div>
    ),
  },
};

export const WithActions: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: "Confirm Action",
    children: <p>Are you sure you want to proceed with this action?</p>,
    footer: (
      <div className="flex gap-3 justify-end">
        <button className="px-4 py-2 border rounded">Cancel</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          Confirm
        </button>
      </div>
    ),
  },
};

export const LargeContent: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: "Large Modal",
    children: (
      <div className="space-y-2">
        <p>This modal has substantial content.</p>
        <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
          Large Content Area
        </div>
      </div>
    ),
  },
};

export const FocusTrap: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: "Focus Trap Demo",
    children: (
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <p>
          Tab through the fields below. Focus should cycle within the modal and
          never escape to the page behind it.
        </p>
        <div className="space-y-1">
          <label htmlFor="focus-trap-name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="focus-trap-name"
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your name"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="focus-trap-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="focus-trap-email"
            type="email"
            className="w-full border rounded px-3 py-2"
            placeholder="you@example.com"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Submit
          </button>
        </div>
      </form>
    ),
  },
};

export const FocusRestoration: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: "Focus Restoration Demo",
    children: (
      <div className="space-y-4">
        <p>
          Close this modal (via the close button or Escape). Focus should return
          to the "Open Modal" button that triggered it.
        </p>
        <p className="text-sm text-gray-600">
          Use a keyboard to verify the focus ring lands back on the trigger.
        </p>
      </div>
    ),
  },
};
