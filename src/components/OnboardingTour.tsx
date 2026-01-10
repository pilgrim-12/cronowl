"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to CronOwl!",
    description:
      "CronOwl monitors your cron jobs and scheduled tasks. Get notified instantly when something goes wrong. Let's take a quick tour to get you started.",
    icon: (
      <svg
        className="w-12 h-12 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: "create-check",
    title: "Create Your First Check",
    description:
      'Click the "New Check" button to create a monitoring check. Give it a name, set how often it should ping (e.g., every 5 minutes), and set a grace period for when to alert you if it misses a ping.',
    icon: (
      <svg
        className="w-12 h-12 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 4v16m8-8H4"
        />
      </svg>
    ),
  },
  {
    id: "ping-url",
    title: "Copy Your Ping URL",
    description:
      "Each check has a unique ping URL. Add this URL to your cron job script - just make an HTTP request to it at the end of your job. CronOwl will track each ping and alert you if it stops.",
    icon: (
      <svg
        className="w-12 h-12 text-purple-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    id: "notifications",
    title: "Set Up Notifications",
    description:
      "Go to Settings to configure how you want to be notified. CronOwl supports Email, Telegram, Push notifications, and Webhooks. Enable the channels that work best for you.",
    icon: (
      <svg
        className="w-12 h-12 text-yellow-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
  {
    id: "complete",
    title: "You're All Set!",
    description:
      "That's it! Your cron jobs are now being monitored. You can also create HTTP monitors to check if your websites and APIs are responding. Explore the dashboard to see all features.",
    icon: (
      <svg
        className="w-12 h-12 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          // Show tour if onboardingCompleted is not true
          if (userData.onboardingCompleted !== true) {
            setShowTour(true);
          }
        } else {
          // New user, show tour
          setShowTour(true);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setLoading(false);
      }
    }

    checkOnboardingStatus();
  }, [user]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await markOnboardingComplete();
    setShowTour(false);
    onComplete?.();
  };

  const handleComplete = async () => {
    await markOnboardingComplete();
    setShowTour(false);
    onComplete?.();
  };

  const markOnboardingComplete = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      });
    } catch (error) {
      console.error("Error marking onboarding complete:", error);
    }
  };

  if (loading || !showTour) {
    return null;
  }

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {TOUR_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-8 bg-blue-500"
                  : index < currentStep
                    ? "w-4 bg-blue-300"
                    : "w-4 bg-gray-300 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">{step.icon}</div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
          {step.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-8 leading-relaxed">
          {step.description}
        </p>

        {/* Step counter */}
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-6">
          Step {currentStep + 1} of {TOUR_STEPS.length}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          {!isFirstStep && (
            <button
              onClick={handlePrevious}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Back
            </button>
          )}

          {isFirstStep && (
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Skip Tour
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            {isLastStep ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Export function to restart tour (for settings page)
export async function restartOnboardingTour(userId: string): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    onboardingCompleted: false,
  });
}
