'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, Award, RotateCcw, Download } from 'lucide-react';
import courseService from '@/lib/api/courseService';

export default function FinalAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id;

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssessmentData();
  }, [courseId]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      const [assessmentData, enrollmentData] = await Promise.all([
        courseService.getFinalAssessment(courseId),
        courseService.getMyEnrollments() // Get user's enrollments
      ]);

      setAssessment(assessmentData);
      
      // Find the enrollment for this course
      const currentEnrollment = enrollmentData.enrollments?.find(
        e => e.courseId._id === courseId || e.courseId === courseId
      );
      setEnrollment(currentEnrollment);

      // Initialize answers object
      const initialAnswers = {};
      assessmentData.questions?.forEach((_, index) => {
        initialAnswers[index] = '';
      });
      setAnswers(initialAnswers);
    } catch (err) {
      console.error('Error fetching assessment:', err);
      setError('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate all questions are answered
    const allAnswered = assessment.questions.every((_, idx) => answers[idx] && answers[idx].trim() !== '');
    
    if (!allAnswered) {
      alert('Please answer all questions before submitting');
      return;
    }

    try {
      setLoading(true);
      
      // Convert answers object to array
      const answersArray = assessment.questions.map((_, idx) => answers[idx]);
      
      // Submit to backend
      const result = await courseService.submitFinalAssessment(enrollment._id, answersArray);
      
      setResults(result);
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting assessment:', err);
      alert(err.message || 'Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setSubmitted(false);
    setResults(null);
    
    // Reset answers
    const initialAnswers = {};
    assessment.questions?.forEach((_, index) => {
      initialAnswers[index] = '';
    });
    setAnswers(initialAnswers);
  };

  const handleRestartCourse = async () => {
    if (!confirm('Are you sure you want to restart the entire course? All your progress will be reset.')) {
      return;
    }

    try {
      setLoading(true);
      await courseService.restartCourse(enrollment._id);
      alert('Course restarted successfully. Redirecting to course page...');
      router.push(`/courses/${courseId}`);
    } catch (err) {
      console.error('Error restarting course:', err);
      alert('Failed to restart course');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (results?.certificateUrl) {
      window.open(results.certificateUrl, '_blank');
    }
  };

  if (loading && !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  // Results View (after submission)
  if (submitted && results) {
    const passed = results.passed;
    const canRetry = results.canRetry;
    const mustRestart = results.mustRestartCourse;

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Result Header */}
          <div className={`rounded-lg p-8 mb-6 text-center ${
            passed ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
          }`}>
            {passed ? (
              <>
                <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-green-800 mb-2">Congratulations! 🎉</h1>
                <p className="text-green-700 text-lg mb-4">You passed the final assessment!</p>
              </>
            ) : (
              <>
                <XCircle className="w-20 h-20 text-red-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-red-800 mb-2">Assessment Not Passed</h1>
                <p className="text-red-700 text-lg mb-4">Keep trying! You can do it!</p>
              </>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600">Your Score</p>
                <p className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {results.score.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600">Passing Score</p>
                <p className="text-2xl font-bold text-blue-600">{results.passingScore}%</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600">Correct Answers</p>
                <p className="text-2xl font-bold text-gray-800">{results.correctCount}/{results.totalQuestions}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600">Attempts Used</p>
                <p className="text-2xl font-bold text-gray-800">{results.attemptsUsed}/3</p>
              </div>
            </div>

            {/* Certificate Section */}
            {passed && results.certificateEarned && (
              <div className="mt-6 bg-white rounded-lg p-6 shadow-lg">
                <Award className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Certificate Earned!</h2>
                <p className="text-gray-600 mb-4">You have successfully completed this course</p>
                <button
                  onClick={handleDownloadCertificate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto"
                >
                  <Download className="w-5 h-5" />
                  Download Certificate
                </button>
              </div>
            )}

            {/* Retry or Restart Options */}
            <div className="mt-6 flex gap-3 justify-center">
              {canRetry && !passed && (
                <button
                  onClick={handleRetry}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Retry Assessment ({results.attemptsRemaining} attempts left)
                </button>
              )}

              {mustRestart && (
                <button
                  onClick={handleRestartCourse}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Restart Course
                </button>
              )}

              {passed && (
                <button
                  onClick={() => router.push('/student/dashboard')}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Detailed Results</h2>
            <div className="space-y-4">
              {results.results.map((result, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded-lg p-4 ${
                    result.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {result.isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 mb-2">
                        Question {idx + 1}: {result.questionText}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                          <span className="font-semibold">Your Answer:</span> {result.userAnswer}
                        </p>
                        {!result.isCorrect && (
                          <p className="text-green-700">
                            <span className="font-semibold">Correct Answer:</span> {result.correctAnswer}
                          </p>
                        )}
                        {result.explanation && (
                          <p className="text-blue-700 bg-blue-50 p-2 rounded mt-2">
                            <span className="font-semibold">Explanation:</span> {result.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assessment Taking View
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {assessment?.title || 'Final Assessment'}
            </h1>
            {assessment?.description && (
              <p className="text-gray-600">{assessment.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 items-center text-sm">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                {assessment?.questions?.length || 0} Questions
              </span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">
                Passing Score: {assessment?.passingScore || 70}%
              </span>
              {enrollment && (
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold">
                  Attempts: {enrollment.finalAssessmentAttempts || 0}/3
                </span>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {assessment?.questions?.map((question, index) => (
              <div key={index} className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition">
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-800 mb-2">{question.text}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {question.type === 'multiple-choice' ? 'Multiple Choice' : 
                       question.type === 'true-false' ? 'True/False' : 'Essay'}
                    </span>
                  </div>
                </div>

                {/* Answer Options */}
                <div className="ml-11">
                  {question.type === 'multiple-choice' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optIdx) => (
                        <label
                          key={optIdx}
                          className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                        >
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={option}
                            checked={answers[index] === option}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="font-semibold text-gray-700">{String.fromCharCode(65 + optIdx)}.</span>
                          <span className="text-gray-800">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'true-false' && (
                    <div className="space-y-2">
                      {['True', 'False'].map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                        >
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={option}
                            checked={answers[index] === option}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-gray-800 font-semibold">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'essay' && (
                    <textarea
                      value={answers[index] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder="Type your answer here..."
                      rows={4}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition"
            >
              {loading ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
