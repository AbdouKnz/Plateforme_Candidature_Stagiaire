import React, {
  useState,
  Children,
  forwardRef,
  useImperativeHandle,
  type ReactNode,
} from "react"
import { motion, AnimatePresence } from "motion/react"

import "./stepper.css"

export interface StepperHandle {
  /** Go to the next step (subject to the beforeNext guard, if provided). */
  next: () => void
  /** Go back to the previous step. */
  prev: () => void
  /** Trigger the completion flow for the last step. */
  complete: () => void
}

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  initialStep?: number
  onStepChange?: (step: number) => void
  onFinalStepCompleted?: () => void
  stepCircleContainerClassName?: string
  stepContainerClassName?: string
  contentClassName?: string
  footerClassName?: string
  backButtonProps?: React.ComponentProps<"button">
  nextButtonProps?: React.ComponentProps<"button">
  backButtonText?: string
  nextButtonText?: string
  disableStepIndicators?: boolean
  stepLabels?: string[]
  renderStepIndicator?: (args: {
    step: number
    currentStep: number
    onStepClick: (step: number) => void
  }) => ReactNode
  /** Async guard run before advancing. Return false (or an awaited false) to block the transition. */
  beforeNext?: () => boolean | Promise<boolean>
}

const Stepper = forwardRef<StepperHandle, StepperProps>(function Stepper(
  {
    children,
    initialStep = 1,
    onStepChange = () => {},
    onFinalStepCompleted = () => {},
    stepCircleContainerClassName = "",
    stepContainerClassName = "",
    contentClassName = "",
    footerClassName = "",
    backButtonProps = {},
    nextButtonProps = {},
    backButtonText = "Back",
    nextButtonText = "Continue",
    disableStepIndicators = false,
    stepLabels,
    renderStepIndicator,
    beforeNext,
    ...rest
  },
  ref
) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [direction, setDirection] = useState(0)
  const stepsArray = Children.toArray(children)
  const totalSteps = stepsArray.length
  const isCompleted = currentStep > totalSteps
  const isLastStep = currentStep === totalSteps

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep)
    if (newStep > totalSteps) {
      onFinalStepCompleted()
    } else {
      onStepChange(newStep)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1)
      updateStep(currentStep - 1)
    }
  }

  const handleNext = async () => {
    if (isLastStep || isCompleted) return
    if (beforeNext) {
      const ok = await beforeNext()
      if (!ok) return
    }
    setDirection(1)
    updateStep(currentStep + 1)
  }

  const handleComplete = async () => {
    if (beforeNext) {
      const ok = await beforeNext()
      if (!ok) return
    }
    setDirection(1)
    updateStep(totalSteps + 1)
  }

  useImperativeHandle(ref, () => ({
    next: handleNext,
    prev: handleBack,
    complete: handleComplete,
  }))

  return (
    <div className="outer-container" {...rest}>
      <div className={`step-circle-container ${stepCircleContainerClassName}`}>
        <div className={`step-indicator-row ${stepContainerClassName}`}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1
            const isNotLastStep = index < totalSteps - 1
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: (clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1)
                      updateStep(clicked)
                    },
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    label={stepLabels?.[index]}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={(clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1)
                      updateStep(clicked)
                    }}
                  />
                )}
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            )
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`step-content-default ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`footer-container ${footerClassName}`}>
            <div className={`footer-nav ${currentStep !== 1 ? "spread" : "end"}`}>
              {currentStep !== 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className={`back-button ${currentStep === 1 ? "inactive" : ""}`}
                  {...backButtonProps}
                >
                  {backButtonText}
                </button>
              )}
              <button
                type="button"
                onClick={isLastStep ? handleComplete : handleNext}
                className="next-button"
                {...nextButtonProps}
              >
                {isLastStep ? "Complete" : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
function StepContentWrapper({ isCompleted, currentStep, direction, children, className }: {
  isCompleted: boolean
  currentStep: number
  direction: number
  children?: ReactNode
  className: string
}) {
  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      {!isCompleted && (
        <motion.div
          key={currentStep}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const stepVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? -48 : 48,
    opacity: 0,
  }),
}

export function Step({ children }: { children?: ReactNode }) {
  return <div className="step-default">{children}</div>
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
  disableStepIndicators,
  label,
}: {
  step: number
  currentStep: number
  onClickStep: (step: number) => void
  disableStepIndicators: boolean
  label?: string
}) {
  const status = currentStep === step ? "active" : currentStep < step ? "inactive" : "complete"

  const handleClick = () => {
    // Only allow navigating back to already-visited steps; forward jumps are gated by validation.
    if (step > currentStep) return
    if (step !== currentStep && !disableStepIndicators) onClickStep(step)
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick()
      }}
      className="step-indicator"
      style={disableStepIndicators ? { pointerEvents: "none", opacity: 0.5 } : {}}
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: "var(--muted)", color: "var(--muted-foreground)" },
          active: { scale: 1, backgroundColor: "var(--primary)", color: "var(--primary-foreground)" },
          complete: { scale: 1, backgroundColor: "var(--accent)", color: "var(--accent-foreground)" },
        }}
        transition={{ duration: 0.3 }}
        className="step-indicator-inner"
      >
        {status === "complete" ? (
          <CheckIcon className="check-icon" />
        ) : status === "active" ? (
          <div className="active-dot" />
        ) : (
          <span className="step-number">{step}</span>
        )}
      </motion.div>
      {label && (
        <span
          className={`step-indicator-label ${
            status === "active" ? "active" : status === "complete" ? "complete" : ""
          }`}
        >
          {label}
        </span>
      )}
    </motion.div>
  )
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
  const lineVariants = {
    incomplete: { width: 0, backgroundColor: "transparent" },
    complete: { width: "100%", backgroundColor: "var(--primary)" },
  }

  return (
    <div className="step-connector">
      <motion.div
        className="step-connector-inner"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? "complete" : "incomplete"}
        transition={{ duration: 0.4 }}
      />
    </div>
  )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.1, type: "tween", ease: "easeOut", duration: 0.3 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}

export default Stepper