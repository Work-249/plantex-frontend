import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, CheckCircle, AlertCircle, Bookmark, Monitor, Shield, Code
} from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';
import CodingInterface from '../Coding/CodingInterface';

interface Question {
  _id: string;
  questionText: string;
  questionImageUrl?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  optionImages?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  marks: number;
}

interface Section {
  _id: string;
  sectionName: string;
  sectionDuration: number;
  numberOfQuestions: number;
  marksPerQuestion: number;
  questions: Question[];
}

interface Test {
  _id: string;
  testName: string;
  testDescription: string;
  subject: string;
  testType?: string;
  hasSections?: boolean;
  sections?: Section[];
  numberOfQuestions: number;
  totalMarks: number;
  duration: number;
  questions: Question[];
  hasCodingSection?: boolean;
  codingQuestions?: any[];
}

interface TCSStyleTestInterfaceProps {
  test: Test;
  startTime: Date;
  onSubmit: (answers: any[], timeSpent: number, codingSubmissions?: any[]) => Promise<void>;
  onExit: () => void;
}

const TCSStyleTestInterface: React.FC<TCSStyleTestInterfaceProps> = ({
  test,
  startTime,
  onSubmit,
  onExit
}) => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [questionId: string]: boolean }>({});
  const [visitedQuestions, setVisitedQuestions] = useState<{ [questionId: string]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(test.duration * 60);
  const [submitting, setSubmitting] = useState(false);
  const [showSectionComplete, setShowSectionComplete] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showCodingSection, setShowCodingSection] = useState(false);
  const [mcqCompleted, setMcqCompleted] = useState(false);
  const [selectedCodingQuestionId, setSelectedCodingQuestionId] = useState<string | null>(null);
  const [codingSubmissions, setCodingSubmissions] = useState<any[]>([]);
  const [violations, setViolations] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showInstructions) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showInstructions]);

  // Restore saved progress on component mount
  useEffect(() => {
    if (showInstructions) {
      const savedProgress = localStorage.getItem(`test_progress_${test._id}`);
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress);
          setAnswers(progress.answers || {});
          setMarkedForReview(progress.markedForReview || {});
          setVisitedQuestions(progress.visitedQuestions || {});
          setCurrentSectionIndex(progress.currentSectionIndex || 0);
          setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
          setViolations(progress.violations || 0);
          setMcqCompleted(progress.mcqCompleted || false);
          setSelectedCodingQuestionId(progress.selectedCodingQuestionId || null);
        } catch (error) {
          console.error('Error restoring test progress:', error);
        }
      }
    }
  }, [test._id, showInstructions]);

  // Track violations on tab switch
  useEffect(() => {
    if (showInstructions) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations(prev => {
          const newViolations = prev + 1;
          if (newViolations >= 3) {
            alert('⚠️ ALERT: You have exceeded the violation limit! Your test will be auto-submitted.');
          } else {
            alert(`⚠️ Warning: Tab switching detected! Violation ${newViolations}/3 recorded.`);
          }
          return newViolations;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [showInstructions]);

  // Save progress on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!showInstructions && !submitting) {
        localStorage.setItem(`test_progress_${test._id}`, JSON.stringify({
          answers,
          markedForReview,
          visitedQuestions,
          currentSectionIndex,
          currentQuestionIndex,
          violations,
          timeLeft,
          mcqCompleted,
          selectedCodingQuestionId,
          codingSubmissions,
          testStartTime: startTime.getTime()
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, markedForReview, visitedQuestions, currentSectionIndex, currentQuestionIndex, violations, timeLeft, mcqCompleted, selectedCodingQuestionId, codingSubmissions, showInstructions, submitting, test._id, startTime]);

  // Auto-submit when violations >= 3
  useEffect(() => {
    if (violations >= 3 && !showInstructions && !submitting && !mcqCompleted) {
      const autoSubmitTest = async () => {
        setSubmitting(true);
        try {
          // Check if there's a coding section - if yes, transition to it instead of submitting
          if (test.hasCodingSection && test.codingQuestions && test.codingQuestions.length > 0) {
            console.log('⚠️ Violations reached 3 - Transitioning to coding section instead of auto-submitting');
            setMcqCompleted(true);
            setShowCodingSection(true);
            const firstCoding = test.codingQuestions[0];
            if (firstCoding) {
              setSelectedCodingQuestionId(firstCoding._id || firstCoding.questionId);
            }
            setSubmitting(false);
            return;
          }

          // No coding section - submit MCQ answers
          console.log('⚠️ Violations reached 3 - Auto-submitting test (no coding section)');
          const answerArray = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
            questionId,
            selectedAnswer
          }));

          const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
          await onSubmit(answerArray, timeSpent, codingSubmissions);
          
          // Clear saved progress after submission
          localStorage.removeItem(`test_progress_${test._id}`);
          
          setSubmitting(false);
          onExit();
        } catch (error) {
          console.error('Error auto-submitting test:', error);
          setSubmitting(false);
        }
      };

      autoSubmitTest();
    }
  }, [violations, showInstructions, submitting, mcqCompleted, answers, codingSubmissions, test._id, startTime, onSubmit, onExit]);

  const enterFullscreen = async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  const handleStartTest = async () => {
    if (!agreedToTerms) {
      alert('Please accept the terms and conditions to proceed.');
      return;
    }
    await enterFullscreen();
    setShowInstructions(false);

    // Check if this is a coding-only test (no MCQ questions)
    const questions = getCurrentSectionQuestions();
    if (!questions || questions.length === 0) {
      console.log('🎯 Coding-only test detected - showing coding section immediately');
      // For coding-only tests, skip MCQ and go straight to coding
      if (test.hasCodingSection && test.codingQuestions && test.codingQuestions.length > 0) {
        setShowCodingSection(true);
        setMcqCompleted(true);
        const firstCoding = test.codingQuestions[0];
        if (firstCoding) {
          setSelectedCodingQuestionId(firstCoding._id || firstCoding.questionId);
        }
      }
    } else {
      // Normal MCQ test - mark first question as visited
      const firstQuestion = questions[0];
      if (firstQuestion) {
        setVisitedQuestions({ [firstQuestion._id]: true });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentSection = (): Section | null => {
    if (test.hasSections && test.sections && test.sections[currentSectionIndex]) {
      return test.sections[currentSectionIndex];
    }
    return null;
  };

  const getCurrentSectionQuestions = (): Question[] => {
    const section = getCurrentSection();
    if (section) {
      return section.questions;
    }
    return test.questions || [];
  };

  const getCurrentQuestion = (): Question | null => {
    const questions = getCurrentSectionQuestions();
    return questions[currentQuestionIndex] || null;
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleClearResponse = () => {
    const currentQ = getCurrentQuestion();
    if (!currentQ) return;
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQ._id];
      return newAnswers;
    });
    setMarkedForReview(prev => {
      const newMarked = { ...prev };
      delete newMarked[currentQ._id];
      return newMarked;
    });
  };

  const handleMarkForReview = () => {
    const currentQ = getCurrentQuestion();
    if (!currentQ) return;
    setMarkedForReview(prev => ({
      ...prev,
      [currentQ._id]: !prev[currentQ._id]
    }));
  };

  const handleSaveAndNext = () => {
    const questions = getCurrentSectionQuestions();
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setVisitedQuestions(prev => ({ ...prev, [questions[nextIndex]._id]: true }));
    } else {
      setShowSectionComplete(true);
    }
  };

  const handleMarkForReviewAndNext = () => {
    handleMarkForReview();
    handleSaveAndNext();
  };

  const handleNavigateToQuestion = (index: number) => {
    const questions = getCurrentSectionQuestions();
    setCurrentQuestionIndex(index);
    setVisitedQuestions(prev => ({ ...prev, [questions[index]._id]: true }));
  };

  const handleNextSection = () => {
    if (test.hasSections && test.sections && currentSectionIndex < test.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
      setShowSectionComplete(false);
      const nextSectionQuestions = test.sections[currentSectionIndex + 1].questions;
      if (nextSectionQuestions[0]) {
        setVisitedQuestions(prev => ({ ...prev, [nextSectionQuestions[0]._id]: true }));
      }
    } else {
      console.log('🔍 End of sections. Checking for coding section:', {
        hasCodingSection: test.hasCodingSection,
        codingQuestionsCount: test.codingQuestions?.length,
        testType: test.testType
      });
      
      if (test.hasCodingSection && test.codingQuestions && test.codingQuestions.length > 0) {
        console.log('✅ Moving to coding section');
        setMcqCompleted(true);
        setShowSectionComplete(false);
        setShowCodingSection(true);
        const firstCoding = test.codingQuestions[0];
        if (firstCoding) {
          setSelectedCodingQuestionId(firstCoding._id || firstCoding.questionId);
        }
      } else {
        console.log('❌ No coding section. Showing submit dialog.');
        setShowSubmitConfirm(true);
      }
    }
  };

  const getQuestionStatus = (question: Question) => {
    const answered = !!answers[question._id];
    const marked = !!markedForReview[question._id];
    const visited = !!visitedQuestions[question._id];

    if (answered && marked) return 'answered-marked';
    if (answered) return 'answered';
    if (marked) return 'marked';
    if (visited) return 'not-answered';
    return 'not-visited';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return 'bg-green-500 text-white';
      case 'not-answered':
        return 'bg-red-500 text-white';
      case 'marked':
      case 'answered-marked':
        return 'bg-purple-500 text-white';
      case 'not-visited':
        return 'bg-gray-300 text-gray-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getSectionCounts = () => {
    const questions = getCurrentSectionQuestions();
    return {
      answered: questions.filter(q => answers[q._id] && !markedForReview[q._id]).length,
      notAnswered: questions.filter(q => !answers[q._id] && visitedQuestions[q._id]).length,
      marked: questions.filter(q => markedForReview[q._id]).length,
      notVisited: questions.filter(q => !visitedQuestions[q._id]).length,
    };
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    
    // Check if there's a coding section and we haven't completed MCQs yet
    if (!mcqCompleted && test.hasCodingSection && test.codingQuestions && test.codingQuestions.length > 0) {
      console.log('⏱️ Time expired - Transitioning to coding section instead of auto-submitting');
      setMcqCompleted(true);
      setShowCodingSection(true);
      const firstCoding = test.codingQuestions[0];
      if (firstCoding) {
        setSelectedCodingQuestionId(firstCoding._id || firstCoding.questionId);
      }
      return;
    }
    
    // No coding section or already in coding - submit now
    await handleSubmit();
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      const allQuestions = test.hasSections && test.sections
        ? test.sections.flatMap(s => s.questions)
        : test.questions;

      const submissionAnswers = allQuestions.map(question => ({
        questionId: question._id,
        selectedAnswer: answers[question._id] || '',
        timeSpent: 0
      }));

      const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60);

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      await onSubmit(submissionAnswers, timeSpent, codingSubmissions);
      
      // Clear saved progress after successful submission
      localStorage.removeItem(`test_progress_${test._id}`);
      
      setShowSubmitConfirm(false);
      setSubmitting(false);
      onExit();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit test. Please try again.');
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  const handleCodingSubmit = async (submissionId: string, score: number) => {
    setCodingSubmissions(prev => [...prev, { submissionId, score }]);
  };

  const currentQuestion = getCurrentQuestion();
  const currentSection = getCurrentSection();
  const counts = getSectionCounts();
  const questions = getCurrentSectionQuestions();

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{test.testName}</h1>
                <p className="text-blue-100 text-lg">{test.subject}</p>
              </div>
              <Shield className="w-20 h-20 text-blue-200 opacity-50" />
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8 grid grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl text-center border-2 border-blue-200">
                <div className="text-3xl font-bold text-blue-700">{test.numberOfQuestions}</div>
                <div className="text-sm text-gray-600 mt-1 font-medium">Questions</div>
              </div>
              <div className="bg-green-50 p-6 rounded-xl text-center border-2 border-green-200">
                <div className="text-3xl font-bold text-green-700">{test.duration}</div>
                <div className="text-sm text-gray-600 mt-1 font-medium">Minutes</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl text-center border-2 border-purple-200">
                <div className="text-3xl font-bold text-purple-700">{test.totalMarks}</div>
                <div className="text-sm text-gray-600 mt-1 font-medium">Total Marks</div>
              </div>
            </div>

            <div className="mb-8 space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-r-lg">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="text-yellow-600" />
                  Important Instructions
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                  <li>Test will be conducted in <strong>FULLSCREEN MODE</strong></li>
                  <li>Answer questions section by section - cannot go back to previous sections</li>
                  <li>Use question palette to navigate within current section</li>
                  <li>The test will auto-submit when time expires</li>
                  <li>Ensure stable internet connection</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-5 rounded-r-lg">
                <h3 className="font-bold text-gray-900 mb-3">Action Buttons</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                  <li><strong>Save & Next:</strong> Save answer and move to next question</li>
                  <li><strong>Mark for Review & Next:</strong> Mark question for review and proceed</li>
                  <li><strong>Clear Response:</strong> Clear your selected answer</li>
                  <li>Click on question numbers in palette to navigate directly</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-5 rounded-r-lg">
                <h3 className="font-bold text-gray-900 mb-3">Question Status Legend</h3>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-green-500"></div>
                    <span className="text-sm">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-red-500"></div>
                    <span className="text-sm">Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-purple-500"></div>
                    <span className="text-sm">Marked for Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gray-300"></div>
                    <span className="text-sm">Not Visited</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-gray-700 text-sm">
                  I have read and understood all instructions and agree to follow all rules during the test.
                </span>
              </label>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={onExit}
                className="px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTest}
                disabled={!agreedToTerms}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                <Monitor className="w-5 h-5" />
                Start Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCodingSection) {
    return (
      <div ref={containerRef} className="fixed inset-0 bg-gray-50 flex flex-col">
        <div className="bg-white shadow-md border-b-2 border-blue-600">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Code className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Coding Section</h1>
              </div>
              <div className="flex items-center gap-6">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  timeLeft <= 300 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  <Clock className="w-5 h-5" />
                  <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
                </div>
                <button
                  onClick={() => {
                    console.log('📝 Coding section submit button clicked');
                    setShowSubmitConfirm(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Submit Test
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="w-full md:w-64 bg-white md:border-r p-4 overflow-y-auto flex-shrink-0">
            <h3 className="font-semibold mb-4">Coding Questions</h3>
            <div className="space-y-2 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
              {test.codingQuestions?.map((cq: any, idx: number) => (
                <button
                  key={cq._id || idx}
                  onClick={() => setSelectedCodingQuestionId(cq._id || cq.questionId)}
                  className={`flex-shrink-0 md:flex-shrink md:w-full text-left p-3 rounded-lg border-2 ${
                    selectedCodingQuestionId === (cq._id || cq.questionId)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium text-sm whitespace-nowrap md:whitespace-normal">{cq.title || `Question ${idx + 1}`}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Points: {cq.points || 100}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            {selectedCodingQuestionId ? (
              <CodingInterface
                questionId={selectedCodingQuestionId}
                fullscreen={true}
                isPractice={false}
                onSubmit={handleCodingSubmit}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Code className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Select a coding question to begin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-gray-100 flex flex-col">
      <div className="bg-white shadow-md border-b-2 border-blue-600">
        <div className="px-6 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{test.testName}</h1>
              {currentSection && (
                <p className="text-sm text-gray-600">
                  Section {currentSectionIndex + 1}: {currentSection.sectionName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeLeft <= 300 ? 'bg-red-100 text-red-700' :
                timeLeft <= 600 ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'
              }`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
              </div>
              <button
                onClick={() => {
                  console.log('🔘 MCQ Submit/Next button clicked:', {
                    hasCodingSection: test.hasCodingSection,
                    codingQuestionsCount: test.codingQuestions?.length
                  });
                  if (test.hasCodingSection && test.codingQuestions && test.codingQuestions.length > 0) {
                    console.log('✅ Transitioning to coding section');
                    setMcqCompleted(true);
                    setShowCodingSection(true);
                    const firstCoding = test.codingQuestions[0];
                    if (firstCoding) {
                      setSelectedCodingQuestionId(firstCoding._id || firstCoding.questionId);
                    }
                  } else {
                    console.log('❌ No coding section - showing submit confirmation');
                    setShowSubmitConfirm(true);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {test.hasCodingSection && (test.codingQuestions?.length ?? 0) > 0 ? 'Next Section (Coding)' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
              <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <div>
                  <span className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  {test.hasSections && (
                    <span className="ml-4 text-sm text-gray-600">
                      Section {currentSectionIndex + 1} of {test.sections?.length || 0}
                    </span>
                  )}
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {currentQuestion.marks} Mark{currentQuestion.marks !== 1 ? 's' : ''}
                </span>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
                {currentQuestion.questionText}
              </h3>

              {currentQuestion.questionImageUrl && (
                <div className="mb-6">
                  <img
                    src={currentQuestion.questionImageUrl}
                    alt="Question"
                    className="max-w-full h-auto rounded-lg border shadow-sm"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              )}

              <div className="space-y-3">
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer ${
                      answers[currentQuestion._id] === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion._id}`}
                      value={key}
                      checked={answers[currentQuestion._id] === key}
                      onChange={(e) => handleAnswerSelect(currentQuestion._id, e.target.value)}
                      className="mt-1 w-5 h-5 text-blue-600"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900 mr-2">{key}.</span>
                      <span className="text-gray-700">{value}</span>
                      {currentQuestion.optionImages?.[key as keyof typeof currentQuestion.optionImages] && (
                        <img
                          src={currentQuestion.optionImages[key as keyof typeof currentQuestion.optionImages]}
                          alt={`Option ${key}`}
                          className="mt-2 max-w-full h-auto rounded border"
                          style={{ maxHeight: '200px' }}
                        />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      handleNavigateToQuestion(currentQuestionIndex - 1);
                    }
                  }}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleMarkForReviewAndNext}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Bookmark className="w-5 h-5" />
                    Mark for Review & Next
                  </button>

                  <button
                    onClick={handleClearResponse}
                    disabled={!answers[currentQuestion._id]}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Clear Response
                  </button>

                  <button
                    onClick={handleSaveAndNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Save & Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 bg-white border-l shadow-lg overflow-y-auto">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-900">Questions Palette</h3>
          </div>

          <div className="p-4">
            <div className="mb-4 space-y-2 text-xs">
              <div className="flex justify-between py-2 px-3 bg-green-50 rounded">
                <span>Answered</span>
                <span className="font-bold">{counts.answered}</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-red-50 rounded">
                <span>Not Answered</span>
                <span className="font-bold">{counts.notAnswered}</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-purple-50 rounded">
                <span>Marked for Review</span>
                <span className="font-bold">{counts.marked}</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                <span>Not Visited</span>
                <span className="font-bold">{counts.notVisited}</span>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {currentSection?.sectionName || 'Questions'}
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => {
                  const status = getQuestionStatus(q);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={index}
                      onClick={() => handleNavigateToQuestion(index)}
                      className={`w-10 h-10 rounded font-medium text-sm ${getStatusColor(status)} ${
                        isCurrent ? 'ring-4 ring-yellow-400' : ''
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSectionComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Section Complete!</h2>
              <p className="text-gray-600">
                You have completed {currentSection?.sectionName || 'this section'}
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <h3 className="font-semibold mb-4">Section Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Questions Answered:</span>
                  <span className="font-bold">{counts.answered}/{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marked for Review:</span>
                  <span className="font-bold">{counts.marked}</span>
                </div>
                <div className="flex justify-between">
                  <span>Not Answered:</span>
                  <span className="font-bold">{counts.notAnswered}</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You cannot return to this section after proceeding to the next section.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowSectionComplete(false)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Review Answers
              </button>
              <button
                onClick={handleNextSection}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {test.hasSections && currentSectionIndex < (test.sections?.length || 0) - 1
                  ? 'Proceed to Next Section'
                  : 'Finish MCQ Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="text-orange-500 w-10 h-10" />
              <h3 className="text-2xl font-bold text-gray-900">Submit Test?</h3>
            </div>

            <div className="mb-6 space-y-4">
              {!['Assessment', 'Mock Test', 'Specific Company Test'].includes(test.testType || '') && (
                <div className="bg-gray-50 p-5 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Answered:</span>
                    <span className="font-bold text-green-600">{counts.answered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Not Answered:</span>
                    <span className="font-bold text-red-600">{counts.notAnswered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Marked for Review:</span>
                    <span className="font-bold text-purple-600">{counts.marked}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-gray-700">Time Remaining:</span>
                    <span className="font-bold text-blue-600">{formatTime(timeLeft)}</span>
                  </div>
                </div>
              )}

              {['Assessment', 'Mock Test', 'Specific Company Test'].includes(test.testType || '') && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    Time Remaining: <span className="font-bold">{formatTime(timeLeft)}</span>
                  </p>
                </div>
              )}

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="text-sm text-red-800 font-medium">
                  Once submitted, you cannot change your answers.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Final
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TCSStyleTestInterface;