import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import FormField from './FormField';
import Input from './Input';
import Select from './Select';

expect.extend(toHaveNoViolations);

describe('FormField accessibility', () => {
  it('associates the label with the input via htmlFor/id', () => {
    render(
      <FormField label="Email" name="email">
        <Input name="email" />
      </FormField>
    );

    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id');
    expect(input).toHaveAttribute('name', 'email');
  });

  it('associates the label with the select via htmlFor/id', () => {
    render(
      <FormField label="Country" name="country">
        <Select name="country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </Select>
      </FormField>
    );

    const select = screen.getByLabelText('Country');
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveAttribute('id');
  });

  it('references error text via aria-describedby and aria-errormessage and sets aria-invalid', () => {
    render(
      <FormField label="Email" name="email" error="Email is required">
        <Input name="email" />
      </FormField>
    );

    const input = screen.getByLabelText('Email');
    const error = screen.getByText('Email is required');

    expect(error).toHaveAttribute('id');
    const errorId = error.getAttribute('id') as string;

    expect(input).toHaveAttribute('aria-describedby', errorId);
    expect(input).toHaveAttribute('aria-errormessage', errorId);
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('references helper text via aria-describedby when there is no error', () => {
    render(
      <FormField label="Email" name="email" helperText="We will never share your email">
        <Input name="email" />
      </FormField>
    );

    const input = screen.getByLabelText('Email');
    const helper = screen.getByText('We will never share your email');

    expect(helper).toHaveAttribute('id');
    const helperId = helper.getAttribute('id') as string;

    expect(input).toHaveAttribute('aria-describedby', helperId);
    expect(input).not.toHaveAttribute('aria-errormessage');
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('sets aria-required when the field is required', () => {
    render(
      <FormField label="Email" name="email" required>
        <Input name="email" />
      </FormField>
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('has no axe violations in the default state', async () => {
    const { container } = render(
      <FormField label="Email" name="email">
        <Input name="email" />
      </FormField>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations in the error state', async () => {
    const { container } = render(
      <FormField label="Email" name="email" error="Email is required">
        <Input name="email" />
      </FormField>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations in the helper text state', async () => {
    const { container } = render(
      <FormField label="Email" name="email" helperText="We will never share your email">
        <Input name="email" />
      </FormField>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations for a select field', async () => {
    const { container } = render(
      <FormField label="Country" name="country">
        <Select name="country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </Select>
      </FormField>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});