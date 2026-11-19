'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  FormProvider,
  useForm,
  type FieldErrors,
  type SubmitHandler,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  campaignCreationSchema,
  type CampaignCreationFormValues,
} from '@/lib/validation';
import CampaignBasicsStep from './CampaignBasicsStep';
import CampaignFundingStep from './CampaignFundingStep';
import CampaignMediaStep from './CampaignMediaStep';
import CampaignReviewStep from './CampaignReviewStep';

export interface CampaignCreationFormProps {
  defaultValues?: Partial<CampaignCreationFormValues>;
  onSubmit: (values: CampaignCreationFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

type StepDefinition = {
  id: string;
  title: string;
  fields: (keyof CampaignCreationFormValues)[];
  Component: React.ComponentType;
};

const STEPS: StepDefinition[] = [
  {
    id: 'basics',
    title: 'Basics',
    fields: ['title', 'description', 'category'],
    Component: CampaignBasicsStep,
  },
  {
    id: 'funding',
    title: 'Funding',
    fields: ['goalAmount', 'currency', 'deadline'],
    Component: CampaignFundingStep,
  },
  {
    id: 'media',
    title: 'Media',
    fields: ['coverImageUrl', 'videoUrl'],
    Component: CampaignMediaStep,
  },
  {
    id: 'review',
    title: 'Review',
    fields: [],
    Component: CampaignReviewStep,
  },
];

const EMPTY_DEFAULTS: CampaignCreationFormValues = {
  title: '',
  description: '',
  category: '',
  goalAmount: 0,
  currency: 'USD',
  deadline: '',
  coverImageUrl: '',
  videoUrl: '',
};

function getErrorCount(errors: FieldErrors<CampaignCreationFormValues>): number {
  return Object.keys(errors).length;
}

export default function CampaignCreationForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CampaignCreationFormProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const mergedDefaults = useMemo<CampaignCreationFormValues>(
    () => ({ ...EMPTY_DEFAULTS, ...defaultValues }),
    [defaultValues],
  );

  const methods = useForm<CampaignCreationFormValues>({
    resolver: zodResolver(campaignCreationSchema),
    defaultValues: mergedDefaults,
    mode: 'onTouched',
  });

  const {
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = methods;

  const activeStep = STEPS[activeStepIndex];
  const isLastStep = activeStepIndex === STEPS.length - 1;
  const submitting = isSubmitting || formIsSubmitting;
  const errorCount = getErrorCount(errors);

  const handleNext = useCallback(async () => {
    const fieldsToValidate = activeStep.fields;
    if (fieldsToValidate.length > 0) {
      const valid = await trigger(fieldsToValidate, { shouldFocus: true });
      if (!valid) {
        return;
      }
    }
    setActiveStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
  }, [activeStep.fields, trigger]);

  const handleBack = useCallback(() => {
    setActiveStepIndex((index) => Math.max(index - 1, 0));
  }, []);

  const handleStepClick = useCallback(
    (index: number) => {
      if (index < activeStepIndex) {
        setActiveStepIndex(index);
      }
    },
    [activeStepIndex],
  );

  const handleFormSubmit: SubmitHandler<CampaignCreationFormValues> = useCallback(
    async (values) => {
      await onSubmit(values);
    },
    [onSubmit],
  );

  const ActiveStepComponent = activeStep.Component;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
        aria-label="Campaign creation form"
      >
        <nav aria-label="Campaign creation steps">
          <ol className="campaign-steps">
            {STEPS.map((step, index) => {
              const isActive = index === activeStepIndex;
              const isComplete = index < activeStepIndex;
              return (
                <li
                  key={step.id}
                  className={[
                    'campaign-steps__item',
                    isActive ? 'campaign-steps__item--active' : '',
                    isComplete ? 'campaign-steps__item--complete' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <button
                    type="button"
                    onClick={() => handleStepClick(index)}
                    disabled={index > activeStepIndex}
                  >
                    <span className="campaign-steps__index">{index + 1}</span>
                    <span className="campaign-steps__title">{step.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="campaign-form__step" data-step={activeStep.id}>
          <ActiveStepComponent />
        </div>

        {errorCount > 0 && (
          <p className="campaign-form__error-summary" role="alert">
            {errorCount === 1
              ? 'There is 1 field that needs attention.'
              : `There are ${errorCount} fields that need attention.`}
          </p>
        )}

        <div className="campaign-form__actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="campaign-form__cancel"
          >
            Cancel
          </button>

          {activeStepIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="campaign-form__back"
            >
              Back
            </button>
          )}

          {!isLastStep && (
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="campaign-form__next"
            >
              Next
            </button>
          )}

          {isLastStep && (
            <button
              type="submit"
              disabled={submitting}
              className="campaign-form__submit"
            >
              {submitting ? 'Creating…' : 'Create campaign'}
            </button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}