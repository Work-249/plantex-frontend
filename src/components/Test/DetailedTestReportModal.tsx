import React from 'react';
import { X, Download, Award, CheckCircle, XCircle, TrendingUp, Code } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface QuestionAnalysis {
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
  marksObtained: number;
  marks: number;
}

interface CodingResult {
  questionId: string;
  questionTitle: string;
  difficulty: string;
  maxPoints: number;
  score: number;
  status: string;
  testCasesPassed: number;
  totalTestCases: number;
  language: string;
  submittedAt: string;
}

interface CodingSummary {
  totalScore: number;
  maxScore: number;
  percentage: number;
  questionsAttempted: number;
  totalQuestions: number;
}

interface TestReport {
  _id: string;
  testId: {
    testName: string;
    subject: string;
    testType: string;
    difficulty?: string;
    companyName?: string;
    totalMarks: number;
    hasCodingSection?: boolean;
  };
  studentId: {
    name: string;
    email: string;
    batch?: string;
    branch?: string;
    section?: string;
  };
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  questionAnalysis: QuestionAnalysis[];
  codingResults?: CodingResult[];
  codingSummary?: CodingSummary;
}

interface DetailedTestReportModalProps {
  report: TestReport;
  onClose: () => void;
  rank?: number;
  totalStudents?: number;
}

const DetailedTestReportModal: React.FC<DetailedTestReportModalProps> = ({
  report,
  onClose,
  rank,
  totalStudents
}) => {
  // Debug: Log report data to console
  console.log('=== DETAILED REPORT DATA ===');
  console.log('Full report:', JSON.stringify(report, null, 2));
  console.log('Has coding results?', report.codingResults ? 'YES' : 'NO');
  console.log('Coding results count:', report.codingResults?.length || 0);
  console.log('Coding results:', report.codingResults);
  console.log('Coding summary:', report.codingSummary);
  console.log('Test has coding section?', report.testId?.hasCodingSection);
  console.log('===========================');

  const performanceData = [
    { name: 'Correct', value: report.correctAnswers, color: '#10B981' },
    { name: 'Incorrect', value: report.incorrectAnswers, color: '#EF4444' }
  ];

  const sectionData = [
    { section: 'Correct', count: report.correctAnswers },
    { section: 'Incorrect', count: report.incorrectAnswers }
  ];

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percentage >= 50) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (percentage >= 40) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const grade = getGrade(report.percentage);

  const handleDownload = () => {
    const reportContent = `
Test Report
===========

Student: ${report.studentId.name}
Email: ${report.studentId.email}
${report.studentId.batch ? `Batch: ${report.studentId.batch}` : ''}
${report.studentId.branch ? `Branch: ${report.studentId.branch}` : ''}

Test Information
----------------
Test Name: ${report.testId.testName}
Subject: ${report.testId.subject}
Type: ${report.testId.testType}
${report.testId.companyName ? `Company: ${report.testId.companyName}` : ''}
${report.testId.difficulty ? `Difficulty: ${report.testId.difficulty}` : ''}

Performance Summary
------------------
Total Marks: ${report.totalMarks}
Marks Obtained: ${report.marksObtained}
Percentage: ${report.percentage.toFixed(2)}%
Grade: ${grade.grade}
Status: ${report.percentage >= 40 ? 'Pass' : 'Fail'}

Correct Answers: ${report.correctAnswers}
Incorrect Answers: ${report.incorrectAnswers}
Time Spent: ${report.timeSpent} minutes

${rank && totalStudents ? `Rank: ${rank} out of ${totalStudents}` : ''}

Date: ${new Date(report.createdAt).toLocaleDateString()}
Time: ${new Date(report.createdAt).toLocaleTimeString()}

Question-wise Analysis
---------------------
${report.questionAnalysis.map((q, i) => `
${i + 1}. ${q.questionText}
   Your Answer: ${q.studentAnswer}
   Correct Answer: ${q.correctAnswer}
   Result: ${q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
   Marks: ${q.marksObtained}/${q.marks}
`).join('\n')}

${report.codingResults && report.codingResults.length > 0 ? `
Coding Section Results
======================

${report.codingSummary ? `
Summary
-------
Total Score: ${report.codingSummary.totalScore}/${report.codingSummary.maxScore} points (${report.codingSummary.percentage.toFixed(2)}%)
Questions Attempted: ${report.codingSummary.questionsAttempted}/${report.codingSummary.totalQuestions}

` : ''}
Question-wise Results
--------------------
${report.codingResults.map((cr, i) => `
${i + 1}. ${cr.questionTitle}
   Difficulty: ${cr.difficulty}
   Language: ${cr.language}
   Status: ${cr.status.replace(/_/g, ' ').toUpperCase()}
   Score: ${cr.score}/${cr.maxPoints} points
   Test Cases Passed: ${cr.testCasesPassed}/${cr.totalTestCases}
   Submitted At: ${new Date(cr.submittedAt).toLocaleString()}
`).join('\n')}
` : ''}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.testId.testName.replace(/\s+/g, '_')}_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Detailed Test Report</h2>
            <p className="text-sm text-gray-600">{report.testId.testName}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Download Report
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${grade.bg} rounded-lg p-4 text-center border-2 ${grade.color.replace('text-', 'border-')}`}>
              <Award className={`w-8 h-8 ${grade.color} mx-auto mb-2`} />
              <div className={`text-3xl font-bold ${grade.color}`}>{grade.grade}</div>
              <p className="text-sm text-gray-600 mt-1">Grade</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-blue-600">{report.percentage.toFixed(1)}%</div>
              <p className="text-sm text-gray-600 mt-1">Score</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-600">{report.correctAnswers}</div>
              <p className="text-sm text-gray-600 mt-1">Correct</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-red-600">{report.incorrectAnswers}</div>
              <p className="text-sm text-gray-600 mt-1">Incorrect</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="font-semibold text-gray-900 mb-3">Test Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subject:</span>
                  <span className="font-medium">{report.testId.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{report.testId.testType}</span>
                </div>
                {report.testId.companyName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-medium">{report.testId.companyName}</span>
                  </div>
                )}
                {report.testId.difficulty && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium">{report.testId.difficulty}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-medium">{report.correctAnswers + report.incorrectAnswers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Taken:</span>
                  <span className="font-medium">{report.timeSpent} min</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="font-semibold text-gray-900 mb-3">Performance Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Marks Obtained:</span>
                  <span className="font-medium">{report.marksObtained}/{report.totalMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-medium">
                    {((report.correctAnswers / (report.correctAnswers + report.incorrectAnswers)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${report.percentage >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                    {report.percentage >= 40 ? 'Pass' : 'Fail'}
                  </span>
                </div>
                {rank && totalStudents && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rank:</span>
                    <span className="font-medium">{rank} / {totalStudents}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Answer Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Performance Chart</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="section" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {report.percentage >= 90 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-yellow-600" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Outstanding Performance!</h4>
                  <p className="text-sm text-yellow-700">You scored above 90%. Excellent work!</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">Question-wise Analysis</h3>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {report.questionAnalysis.map((question, index) => (
                <div
                  key={index}
                  className={`p-4 ${question.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900 flex-1">
                      {index + 1}. {question.questionText}
                    </h4>
                    <div className="flex items-center gap-2 ml-4">
                      {question.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="text-sm font-medium">
                        {question.marksObtained}/{question.marks}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    {Object.entries(question.options).map(([key, value]) => (
                      <div
                        key={key}
                        className={`p-2 rounded text-sm ${
                          key === question.correctAnswer
                            ? 'bg-green-100 border border-green-300'
                            : key === question.studentAnswer && !question.isCorrect
                            ? 'bg-red-100 border border-red-300'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <span className="font-medium">{key})</span> {value}
                        {key === question.correctAnswer && (
                          <span className="ml-2 text-green-600 text-xs font-medium">✓ Correct</span>
                        )}
                        {key === question.studentAnswer && key !== question.correctAnswer && (
                          <span className="ml-2 text-red-600 text-xs font-medium">✗ Your answer</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-sm">
                    <span className="text-gray-600">Your answer: </span>
                    <span className={`font-medium ${question.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {question.studentAnswer}
                    </span>
                    {!question.isCorrect && (
                      <>
                        <span className="text-gray-600"> | Correct answer: </span>
                        <span className="font-medium text-green-600">{question.correctAnswer}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coding Results Section */}
          {report.codingResults && report.codingResults.length > 0 && (
            <div className="bg-white rounded-lg border">
              <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Coding Section Results</h3>
                  </div>
                  {report.codingSummary && (
                    <div className="text-sm">
                      <span className="font-medium text-purple-600">
                        {report.codingSummary.totalScore}/{report.codingSummary.maxScore} points
                      </span>
                      <span className="text-gray-500 ml-2">
                        ({report.codingSummary.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {report.codingSummary && (
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Questions Attempted:</span>
                      <span className="ml-2 font-medium">{report.codingSummary.questionsAttempted}/{report.codingSummary.totalQuestions}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Score:</span>
                      <span className="ml-2 font-medium">{report.codingSummary.totalScore} pts</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Max Score:</span>
                      <span className="ml-2 font-medium">{report.codingSummary.maxScore} pts</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="ml-2 font-medium">{report.codingSummary.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="divide-y max-h-96 overflow-y-auto">
                {report.codingResults.map((result, index) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'accepted': return 'bg-green-100 text-green-800 border-green-300';
                      case 'wrong_answer': return 'bg-red-100 text-red-800 border-red-300';
                      case 'runtime_error': return 'bg-orange-100 text-orange-800 border-orange-300';
                      case 'time_limit_exceeded': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                      case 'compilation_error': return 'bg-red-100 text-red-800 border-red-300';
                      default: return 'bg-gray-100 text-gray-800 border-gray-300';
                    }
                  };

                  const getDifficultyColor = (difficulty: string) => {
                    switch (difficulty?.toLowerCase()) {
                      case 'easy': return 'text-green-600';
                      case 'medium': return 'text-yellow-600';
                      case 'hard': return 'text-red-600';
                      default: return 'text-gray-600';
                    }
                  };

                  return (
                    <div key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {index + 1}. {result.questionTitle}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-sm font-medium ${getDifficultyColor(result.difficulty)}`}>
                              {result.difficulty}
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-600">
                              Language: {result.language}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-purple-600">
                            {result.score}/{result.maxPoints}
                          </div>
                          <div className="text-xs text-gray-500">points</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(result.status)}`}>
                          {result.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">
                          Test Cases: {result.testCasesPassed}/{result.totalTestCases} passed
                        </span>
                      </div>

                      {result.testCasesPassed > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${(result.testCasesPassed / result.totalTestCases) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-500">
                        Submitted: {new Date(result.submittedAt).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedTestReportModal;