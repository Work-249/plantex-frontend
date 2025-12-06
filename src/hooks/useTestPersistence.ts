import { useEffect, useCallback } from 'react';

export interface TestProgressData {
  answers: Record<string, string>;
  markedForReview?: Record<string, boolean> | string[];
  visited?: Record<string, boolean> | string[];
  visitedQuestions?: Record<string, boolean>;
  currentSectionIndex?: number;
  currentQuestionIndex?: number;
  violations?: number;
  sectionTimeLeft?: number;
  mcqCompleted?: boolean;
  selectedCodingQuestionId?: string | null;
  codingSubmissions?: any[];
  testStartTime?: number;
}

interface UseTestPersistenceProps {
  testId: string;
  testData: TestProgressData;
  isActive: boolean; // whether the test interface is currently active (not showing instructions)
  isSubmitting: boolean;
}

export const useTestPersistence = ({
  testId,
  testData,
  isActive,
  isSubmitting
}: UseTestPersistenceProps) => {

  // Save progress on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isActive && !isSubmitting) {
        // Save directly to localStorage as backup
        localStorage.setItem(`test_progress_${testId}`, JSON.stringify(testData));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testData, isActive, isSubmitting, testId]);

  // Also save to localStorage directly as a backup
  const saveProgressDirectly = useCallback(() => {
    if (isActive && !isSubmitting) {
      localStorage.setItem(`test_progress_${testId}`, JSON.stringify(testData));
    }
  }, [testId, testData, isActive, isSubmitting]);

  // Clear saved progress
  const clearProgress = useCallback(() => {
    localStorage.removeItem(`test_progress_${testId}`);
  }, [testId]);

  return {
    saveProgressDirectly,
    clearProgress
  };
};
