/**
 * Client-side security utilities for assessment submission
 * Handles CSRF tokens, encryption, and secure submission
 */

import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'assessment_csrf_tokens';
const SUBMISSION_TIMEOUT = 3600000; // 1 hour

/**
 * Retrieve CSRF token from server
 */
export async function getCsrfToken(userId: string): Promise<string> {
  try {
    const response = await fetch('/api/assessment/csrf-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * Validate essay before submission
 */
export function validateEssaySubmission(essay: string): {
  valid: boolean;
  error?: string;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Length validation
  if (!essay || essay.trim().length < 10) {
    return {
      valid: false,
      error: 'Essay must be at least 10 characters long',
      warnings,
    };
  }

  if (essay.length > 10000) {
    return {
      valid: false,
      error: 'Essay must not exceed 10,000 characters',
      warnings,
    };
  }

  // Check for suspicious patterns
  const lineBreakCount = (essay.match(/\n/g) || []).length;
  if (lineBreakCount === 0 && essay.length > 500) {
    warnings.push(
      'Your essay appears to be a single paragraph. Consider breaking it into multiple paragraphs for better readability.',
    );
  }

  // Check for code/HTML injection attempts
  if (/<[^>]*>/g.test(essay)) {
    warnings.push('HTML tags detected and will be removed during submission');
  }

  if (/javascript:|onerror=|onclick=/i.test(essay)) {
    return {
      valid: false,
      error: 'Your submission contains invalid content',
      warnings,
    };
  }

  // Check for excessive repetition
  const words = essay.split(/\s+/);
  const wordFrequency: { [key: string]: number } = {};

  words.forEach(word => {
    const lower = word.toLowerCase();
    wordFrequency[lower] = (wordFrequency[lower] || 0) + 1;
  });

  const frequencyThreshold = Math.ceil(words.length * 0.1); // 10% of total words
  const repeatedWords = Object.entries(wordFrequency).filter(
    ([word, count]) =>
      count > frequencyThreshold && word.length > 5,
  );

  if (repeatedWords.length > 3) {
    warnings.push(
      'Your essay contains many repeated phrases. Try to use more varied vocabulary.',
    );
  }

  return { valid: true, warnings };
}

/**
 * Sanitize user input before submission
 */
export function sanitizeInput(input: string): string {
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Trim excessive whitespace
  sanitized = sanitized
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  return sanitized;
}

/**
 * Submit final assessment with security headers
 */
export async function submitAssessmentSecurely(
  enrollmentId: string,
  answers: any[],
  csrfToken: string,
): Promise<any> {
  try {
    // Validate CSRF token format
    if (!csrfToken || csrfToken.length < 32) {
      throw new Error('Invalid security token');
    }

    // Sanitize all answers
    const sanitizedAnswers = answers.map(answer => {
      if (typeof answer === 'string') {
        return sanitizeInput(answer);
      }
      return answer;
    });

    // Prepare submission
    const submission = {
      enrollmentId,
      answers: sanitizedAnswers,
      submittedAt: new Date().toISOString(),
      clientVersion: '1.0',
    };

    // Send with security headers
    const response = await fetch('/api/courses/submit-final-assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'X-Client-Timestamp': Date.now().toString(),
      },
      credentials: 'include', // Include cookies for session validation
      body: JSON.stringify(submission),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Submission failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Assessment submission error:', error);
    throw error;
  }
}

/**
 * Get assessment results with AI feedback
 */
export async function getAssessmentResults(
  enrollmentId: string,
): Promise<any> {
  try {
    const response = await fetch(
      `/api/courses/assessment-results/${enrollmentId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch assessment results');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching assessment results:', error);
    throw error;
  }
}

/**
 * Format AI evaluation for display
 */
export function formatAiEvaluation(evaluation: any) {
  return {
    score: Math.round(evaluation.aiScore || 0),
    confidence: Math.round(evaluation.aiConfidence || 0),
    status: evaluation.aiGradingStatus || 'requires_review',
    feedback: evaluation.aiFeedback || 'Awaiting evaluation',
    strengths: evaluation.aiIdentifiedStrengths || [],
    weaknesses: evaluation.aiIdentifiedWeaknesses || [],
    keyConceptsFound: evaluation.aiKeyConceptsFound || [],
    semanticMatch: Math.round(evaluation.aiSemanticMatch || 0),
    contentRelevance: Math.round(evaluation.aiContentRelevance || 0),
    plagiarismRisk: Math.round(evaluation.aiPlagiarismRisk || 0),
    cheatingIndicators: evaluation.aiCheatingIndicators || [],
    evaluatedAt: evaluation.aiEvaluatedAt
      ? new Date(evaluation.aiEvaluatedAt).toLocaleString()
      : null,
    isAutoGraded: evaluation.aiGradingStatus !== 'requires_review',
    requiresInstructorReview: evaluation.aiGradingStatus === 'requires_review',
  };
}

/**
 * Calculate confidence badge color and message
 */
export function getConfidenceBadge(confidence: number): {
  color: string;
  message: string;
  icon: string;
} {
  if (confidence >= 85) {
    return {
      color: 'bg-green-100 text-green-800',
      message: 'High confidence - Auto graded',
      icon: '✓',
    };
  }

  if (confidence >= 55) {
    return {
      color: 'bg-yellow-100 text-yellow-800',
      message: 'Medium confidence - Pending review',
      icon: '⏳',
    };
  }

  return {
    color: 'bg-red-100 text-red-800',
    message: 'Low confidence - Awaiting instructor',
    icon: '⚠',
  };
}

/**
 * Check if submission time has expired
 */
export function isSubmissionExpired(submissionTime: Date): boolean {
  const elapsed = Date.now() - new Date(submissionTime).getTime();
  return elapsed > SUBMISSION_TIMEOUT;
}

/**
 * Get plagiarism risk description
 */
export function getPlagiarismRiskDescription(risk: number): {
  level: string;
  description: string;
  color: string;
} {
  if (risk >= 75) {
    return {
      level: 'Very High',
      description: 'Multiple plagiarism indicators detected',
      color: 'text-red-600',
    };
  }

  if (risk >= 50) {
    return {
      level: 'High',
      description: 'Several plagiarism concerns',
      color: 'text-orange-600',
    };
  }

  if (risk >= 25) {
    return {
      level: 'Medium',
      description: 'Some similarity patterns detected',
      color: 'text-yellow-600',
    };
  }

  return {
    level: 'Low',
    description: 'Minimal plagiarism risk',
    color: 'text-green-600',
  };
}

/**
 * Generate submission report for download
 */
export function generateSubmissionReport(
  results: any,
  studentName: string,
  courseName: string,
): string {
  const timestamp = new Date().toLocaleString();
  let report = `ASSESSMENT SUBMISSION REPORT
=====================================
Student: ${studentName}
Course: ${courseName}
Submitted: ${timestamp}

SUMMARY
-------
Score: ${results.score.toFixed(1)}%
Passed: ${results.passed ? 'Yes' : 'No'}
AI-Graded Questions: ${results.results.filter((r: any) => r.aiScore !== undefined).length}
Pending Manual Review: ${results.pendingInstructorReview}

DETAILED RESULTS
----------------`;

  results.results.forEach((result: any, idx: number) => {
    report += `\n\nQuestion ${idx + 1}: ${result.questionType.toUpperCase()}
Text: ${result.questionText}
Your Answer: ${result.studentAnswer}`;

    if (result.aiScore !== undefined) {
      report += `
AI Score: ${result.aiScore}/100
AI Confidence: ${result.aiConfidence}%
Status: ${result.aiGradingStatus}
Feedback: ${result.aiFeedback}
Plagiarism Risk: ${result.aiPlagiarismRisk}%`;
    }

    if (result.aiIdentifiedStrengths?.length > 0) {
      report += `
Strengths: ${result.aiIdentifiedStrengths.join(', ')}`;
    }

    if (result.aiIdentifiedWeaknesses?.length > 0) {
      report += `
Areas for Improvement: ${result.aiIdentifiedWeaknesses.join(', ')}`;
    }
  });

  return report;
}
