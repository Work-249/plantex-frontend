import React, { createContext, useContext, useState } from 'react';

interface TestProgress {
  testId?: string;
  answers: { [questionId: string]: string };
  currentProgress?: number;
  startTime?: Date;
  violations: number;
  lastSaved?: Date;
  markedForReview?: string[];
  visited?: string[];
  currentSectionIndex?: number;
  currentQuestionIndex?: number;
  sectionTimeLeft?: number;
  mcqCompleted?: boolean;
  selectedCodingQuestionId?: string | null;
  testStartTime?: number;
}

interface TestResumeContextType {
  savedTests: { [testId: string]: TestProgress };
  saveTestProgress: (testId: string, progress: TestProgress) => void;
  getTestProgress: (testId: string) => TestProgress | null;
  clearTestProgress: (testId: string) => void;
  clearAllProgress: () => void;
  hasUnsavedProgress: (testId: string) => boolean;
}

const TestResumeContext = createContext<TestResumeContextType | undefined>(undefined);

export const TestResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedTests, setSavedTests] = useState<{ [testId: string]: TestProgress }>({});

  const saveTestProgress = (testId: string, progress: TestProgress) => {
    setSavedTests(prev => ({
      ...prev,
      [testId]: progress
    }));
    // Also save to localStorage for persistence
    try {
      const allProgress = { ...savedTests, [testId]: progress };
      localStorage.setItem('testProgress', JSON.stringify(allProgress));
    } catch (e) {
      console.warn('Failed to save test progress to localStorage:', e);
    }
  };

  const getTestProgress = (testId: string): TestProgress | null => {
    return savedTests[testId] || null;
  };

  const clearTestProgress = (testId: string) => {
    setSavedTests(prev => {
      const updated = { ...prev };
      delete updated[testId];
      try {
        localStorage.setItem('testProgress', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to update localStorage:', e);
      }
      return updated;
    });
  };

  const clearAllProgress = () => {
    setSavedTests({});
    try {
      localStorage.removeItem('testProgress');
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  };

  const hasUnsavedProgress = (testId: string): boolean => {
    return !!savedTests[testId];
  };

  return (
    <TestResumeContext.Provider value={{
      savedTests,
      saveTestProgress,
      getTestProgress,
      clearTestProgress,
      clearAllProgress,
      hasUnsavedProgress
    }}>
      {children}
    </TestResumeContext.Provider>
  );
};

export const useTestResume = () => {
  const context = useContext(TestResumeContext);
  if (!context) {
    throw new Error('useTestResume must be used within TestResumeProvider');
  }
  return context;
};