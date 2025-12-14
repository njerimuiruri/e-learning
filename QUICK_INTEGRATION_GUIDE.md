# AI Assessment & Security - Quick Integration Guide

## What's Ready

✅ **Backend Services Created:**

- `ai-essay-evaluator.service.ts` - AI semantic analysis + plagiarism detection
- `assessment-security.service.ts` - CSRF, rate limiting, encryption, cheating detection
- `assessment-ai.service.ts` - Orchestrates security + AI evaluation
- `assessment.middleware.ts` - CSRF, rate limiting, audit logging middleware

✅ **Frontend Created:**

- `lib/assessment-security.ts` - CSRF token management, validation, secure submission
- `components/AiEvaluationDisplay.tsx` - Display AI scores, feedback, metrics

✅ **Database Updated:**

- `enrollment.schema.ts` - 13 new AI evaluation fields

✅ **Documentation:**

- `AI_ASSESSMENT_SECURITY_IMPLEMENTATION.md` - Complete implementation guide

---

## Next Steps to Enable AI Grading

### STEP 1: Install Dependencies (Backend)

```bash
cd elearning-backend

# Add OpenAI for embeddings
npm install openai

# Add CryptoJS if not already present
npm install crypto-js

# Check crypto is available (built-in to Node.js)
```

### STEP 2: Set Environment Variables

**File:** `.env` in elearning-backend root

```
OPENAI_API_KEY=sk-your-openai-key-here
ENCRYPTION_KEY=your-32-byte-base64-key-here
ASSESSMENT_ENABLED=true
AI_GRADING_ENABLED=true
```

Generate encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### STEP 3: Integrate Services into CoursesModule

**File:** `src/courses/courses.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";
import { AiEssayEvaluatorService } from "../services/ai-essay-evaluator.service";
import { AssessmentSecurityService } from "../services/assessment-security.service";
import { AssessmentAiService } from "../services/assessment-ai.service";
import { Enrollment, EnrollmentSchema } from "../schemas/enrollment.schema";
import { Course, CourseSchema } from "../schemas/course.schema";
import { User, UserSchema } from "../schemas/user.schema";
import { Certificate, CertificateSchema } from "../schemas/certificate.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
      { name: Certificate.name, schema: CertificateSchema },
    ]),
  ],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    AiEssayEvaluatorService,
    AssessmentSecurityService,
    AssessmentAiService,
  ],
  exports: [CoursesService, AiEssayEvaluatorService, AssessmentSecurityService],
})
export class CoursesModule {}
```

### STEP 4: Add Controller Endpoints

**File:** `src/courses/courses.controller.ts` (Add these methods)

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AssessmentAiService } from "../services/assessment-ai.service";
import { AssessmentSecurityService } from "../services/assessment-security.service";

@Controller("courses")
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(
    private coursesService: CoursesService,
    private assessmentAi: AssessmentAiService,
    private securityService: AssessmentSecurityService
  ) {}

  // NEW: Get CSRF token
  @Post("csrf-token")
  async generateCsrfToken(@Req() request: any) {
    const userId = request.user.userId;
    const token = this.securityService.generateCsrfToken(userId);
    return { token, expiresIn: 1800 }; // 30 minutes
  }

  // NEW: Enhanced assessment submission with AI
  @Post("submit-final-assessment-ai")
  async submitFinalAssessmentWithAi(
    @Body() body: { enrollmentId: string; answers: any[] },
    @Req() request: any
  ) {
    const userId = request.user.userId;
    const csrfToken = request.headers["x-csrf-token"];

    return this.assessmentAi.submitFinalAssessmentWithAi(
      body.enrollmentId,
      body.answers,
      csrfToken,
      userId
    );
  }

  // NEW: Get assessment results with AI evaluation
  @Get("assessment-results/:enrollmentId")
  async getAssessmentResults(
    @Param("enrollmentId") enrollmentId: string,
    @Req() request: any
  ) {
    const userId = request.user.userId;

    // Verify ownership
    const enrollment = await this.coursesService.getEnrollment(enrollmentId);
    if (!enrollment || enrollment.studentId.toString() !== userId) {
      throw new UnauthorizedException("Cannot access this enrollment");
    }

    return {
      success: true,
      results: enrollment.finalAssessmentResults || [],
      score: enrollment.finalAssessmentScore || 0,
      passed: enrollment.finalAssessmentPassed || false,
      aiEvaluatedAt: enrollment.finalAssessmentResults?.[0]?.aiEvaluatedAt,
    };
  }

  // OPTIONAL: Instructor endpoint to review pending AI grades
  @Get("instructor/pending-reviews/:courseId")
  @UseGuards(JwtAuthGuard, InstructorGuard)
  async getPendingReviews(
    @Param("courseId") courseId: string,
    @Req() request: any
  ) {
    const enrollments = await this.coursesService.getEnrollmentsNeedingReview(
      courseId
    );

    return {
      success: true,
      pendingCount: enrollments.length,
      enrollments: enrollments.map((e) => ({
        studentName: e.studentId.firstName + " " + e.studentId.lastName,
        enrollmentId: e._id,
        essayAnswers: e.finalAssessmentResults.filter(
          (r) => r.questionType === "essay"
        ),
        aiAnalysis: e.finalAssessmentResults
          .filter((r) => r.aiGradingStatus === "requires_review")
          .map((r) => ({
            questionIndex: r.questionIndex,
            aiScore: r.aiScore,
            aiConfidence: r.aiConfidence,
            aiFeedback: r.aiFeedback,
            studentAnswer: r.studentAnswer,
          })),
      })),
    };
  }
}
```

### STEP 5: Register Middleware in AppModule

**File:** `src/app.module.ts` (Add to configure method)

```typescript
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import {
  CsrfTokenMiddleware,
  RateLimitMiddleware,
  AssessmentAuditMiddleware,
} from "./middleware/assessment.middleware";

@Module({
  // ... existing imports and providers
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security middleware only to assessment endpoints
    consumer
      .apply(
        AssessmentAuditMiddleware,
        RateLimitMiddleware,
        CsrfTokenMiddleware
      )
      .forRoutes("courses/submit-final-assessment-ai");
  }
}
```

### STEP 6: Update Frontend Assessment Page

**File:** `app/final-assessment/page.jsx` (Update the submit handler)

```typescript
"use client";

import { useState, useEffect } from "react";
import {
  getCsrfToken,
  submitAssessmentSecurely,
  validateEssaySubmission,
} from "@/lib/assessment-security";
import {
  AiEvaluationDisplay,
  AiEvaluationSummary,
} from "@/components/AiEvaluationDisplay";

export default function FinalAssessmentPage() {
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const enrollmentId = useRouter().query.enrollmentId; // From URL params
  const userId = "current-user-id"; // From auth context

  // Step 1: Fetch CSRF token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch("/api/courses/csrf-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await response.json();
        setCsrfToken(data.token);
      } catch (err) {
        console.error("Failed to fetch CSRF token:", err);
      }
    };

    if (userId) fetchToken();
  }, [userId]);

  // Step 2: Validate and submit assessment
  const handleSubmitAssessment = async () => {
    try {
      setLoading(true);
      setError("");

      // Validate essay questions
      for (let i = 0; i < questions.length; i++) {
        if (questions[i].type === "essay") {
          const validation = validateEssaySubmission(answers[i]);
          if (!validation.valid) {
            setError(validation.error);
            setLoading(false);
            return;
          }
        }
      }

      // Submit with CSRF protection
      const result = await submitAssessmentSecurely(
        enrollmentId,
        answers,
        csrfToken
      );

      if (result.success) {
        setResults(result);
      } else {
        setError(result.error || "Submission failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!results) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Final Assessment</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Questions and answer inputs here */}

        <button
          onClick={handleSubmitAssessment}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Evaluating..." : "Submit Assessment"}
        </button>
      </div>
    );
  }

  // Step 3: Display results with AI evaluation
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Assessment Results</h1>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-lg font-bold">
          Your Score:{" "}
          <span className="text-3xl text-blue-600">
            {results.score.toFixed(1)}%
          </span>
        </p>
        <p className="mt-2">
          {results.passed ? (
            <span className="text-green-600 font-bold">
              ✓ Assessment Passed!
            </span>
          ) : (
            <span className="text-red-600 font-bold">
              ✗ Assessment Not Passed
            </span>
          )}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Passing Score: {results.passingScore}%
        </p>
      </div>

      {/* Show AI evaluation summary */}
      <AiEvaluationSummary results={results.results} />

      {/* Show detailed results for each question */}
      {results.results.map((result, idx) => (
        <div key={idx} className="bg-white border rounded-lg p-6 mb-4">
          <h3 className="font-bold text-lg mb-2">
            Question {idx + 1}: {result.questionType.toUpperCase()}
          </h3>

          <p className="text-gray-700 mb-4">{result.questionText}</p>

          <div className="bg-gray-50 p-3 rounded mb-4">
            <p className="text-sm text-gray-600">Your Answer:</p>
            <p className="text-gray-900">{result.studentAnswer}</p>
          </div>

          {result.questionType !== "essay" && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">Correct Answer:</p>
              <p
                className={
                  result.isCorrect
                    ? "text-green-600 font-bold"
                    : "text-red-600 font-bold"
                }
              >
                {result.isCorrect ? "✓ " : "✗ "}
                {result.correctAnswer}
              </p>
            </div>
          )}

          {result.explanation && (
            <div className="bg-blue-50 p-3 rounded mb-4">
              <p className="text-sm text-gray-600 font-bold">Explanation:</p>
              <p className="text-gray-900">{result.explanation}</p>
            </div>
          )}

          {/* Show AI evaluation for essay questions */}
          <AiEvaluationDisplay result={result} questionNumber={idx + 1} />
        </div>
      ))}

      {/* Show pending review message if needed */}
      {results.pendingInstructorReview > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
          <p className="font-bold text-yellow-800">
            ⏳ {results.pendingInstructorReview} question(s) pending instructor
            review
          </p>
          <p className="text-sm text-yellow-700 mt-2">
            Your instructor will review these answers and provide final feedback
            soon.
          </p>
        </div>
      )}

      {/* Retry or certificate options */}
      <div className="mt-8">
        {results.passed && results.certificateEarned && (
          <a
            href={results.certificateUrl}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-block"
          >
            Download Certificate
          </a>
        )}

        {!results.passed && results.canRetry && (
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
          >
            Retake Assessment ({results.attemptsRemaining} attempts remaining)
          </button>
        )}

        {!results.passed && !results.canRetry && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mt-4">
            <p className="text-red-800 font-bold">No retakes remaining</p>
            <p className="text-red-700 text-sm mt-2">
              Please contact your instructor for assistance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### STEP 7: Test the System

**Local Testing:**

```bash
# Terminal 1: Start backend
cd elearning-backend
npm run start:dev

# Terminal 2: Start frontend
cd elearning
npm run dev

# Browser: Navigate to final assessment page
# http://localhost:3000/final-assessment?enrollmentId=xxx
```

**Test Cases:**

1. **CSRF Token Test**

   - [ ] Token is generated when page loads
   - [ ] Token is sent in X-CSRF-Token header
   - [ ] Invalid token is rejected with 403

2. **Essay Validation Test**

   - [ ] Short essays (< 10 chars) are rejected
   - [ ] Long essays (> 10000 chars) are rejected
   - [ ] Valid essays pass validation

3. **AI Evaluation Test**

   - [ ] Essays are evaluated by AI service
   - [ ] Scores are between 0-100
   - [ ] Confidence is calculated
   - [ ] Feedback is provided

4. **Results Display Test**

   - [ ] AI scores display correctly
   - [ ] Confidence badges show correct colors
   - [ ] Strengths/weaknesses display
   - [ ] Summary shows pending reviews

5. **Security Test**
   - [ ] Rate limiting blocks after 5 attempts/hour
   - [ ] Sanitization removes HTML tags
   - [ ] Encryption protects sensitive data

---

## Environment Setup Checklist

### Backend (elearning-backend)

- [ ] `npm install openai` added
- [ ] `.env` file created with `OPENAI_API_KEY`
- [ ] `ENCRYPTION_KEY` generated and added to `.env`
- [ ] Services registered in `CoursesModule`
- [ ] Middleware registered in `AppModule`
- [ ] Controller endpoints added
- [ ] Database indices created
- [ ] HTTPS enabled in production

### Frontend (elearning)

- [ ] `lib/assessment-security.ts` created
- [ ] `components/AiEvaluationDisplay.tsx` created
- [ ] Final assessment page updated with new logic
- [ ] CSRF token retrieval implemented
- [ ] Essay validation implemented
- [ ] Results display shows AI feedback

### Monitoring

- [ ] Logging configured for audit trail
- [ ] OpenAI API usage monitored
- [ ] Cheating detection alerts configured
- [ ] Rate limit violations logged

---

## API Endpoints Summary

```
POST   /api/courses/csrf-token                    → Get CSRF token
POST   /api/courses/submit-final-assessment-ai    → Submit with AI grading
GET    /api/courses/assessment-results/:id        → Get results with AI data
GET    /api/courses/instructor/pending-reviews/:id → Instructor review list
```

---

## Security Features Enabled

✅ CSRF Token Protection - Prevents cross-site request forgery
✅ Rate Limiting - 5 attempts/hour, 20/day per user
✅ Input Sanitization - Removes HTML and malicious content
✅ AES-256 Encryption - Protects essay data
✅ Cheating Detection - Identifies suspicious submissions
✅ Audit Logging - Complete trail of all submissions
✅ Integrity Validation - Verifies enrollment and course match
✅ Timing-Safe Comparison - Prevents timing attacks

---

## What Students See

✅ **During submission:**

- Essay validation warnings
- Real-time character count
- Security notice about encryption

✅ **On results page:**

- AI evaluation score (0-100)
- Confidence level with color indicator
- AI-generated feedback
- Identified strengths (green)
- Areas for improvement (orange)
- Key concepts found (blue badges)
- Plagiarism risk level
- Status: "Auto-graded" / "Pending review" / "Awaiting instructor"

---

## What Instructors See (Optional)

✅ **Pending Reviews Dashboard:**

- List of essays needing manual review
- AI evaluation summary for each
- Quick approve/override button
- Add additional feedback

---

## Troubleshooting

**Issue: "CSRF token missing" error**

```
Solution:
1. Ensure getCsrfToken() is called on page load
2. Verify token is in X-CSRF-Token header
3. Check token hasn't expired (30 min max)
```

**Issue: Essays taking too long to evaluate**

```
Solution:
1. OpenAI API takes 0.5-2 seconds per essay
2. For multiple essays, they process in parallel
3. If timeout, check OPENAI_API_KEY is valid
```

**Issue: Rate limiting blocks valid users**

```
Solution:
1. Modify limits in AssessmentSecurityService if needed
2. Default: 5 attempts/hour, 20/day
3. Log blocked attempts to analyze patterns
```

---

## Support

For detailed information on any component, see:

- **Backend Services**: `src/services/ai-essay-evaluator.service.ts`
- **Security**: `src/services/assessment-security.service.ts`
- **Frontend**: `lib/assessment-security.ts`
- **Components**: `components/AiEvaluationDisplay.tsx`
- **Full Guide**: `AI_ASSESSMENT_SECURITY_IMPLEMENTATION.md`

---

**Last Updated:** 2024-01-15  
**Status:** Ready to Integrate  
**Estimated Implementation Time:** 2-3 hours
