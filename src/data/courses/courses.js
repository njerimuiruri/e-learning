export const coursesData = [
  {
    id: 1,
    category: "Marketing",
    title: "Master Digital Marketing Success",
    slug: "master-digital-marketing",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    duration: "8 WEEKS",
    students: "12,450+ STUDENTS ENROLLED",
    rating: 4.8,
    level: "Beginner-Advanced",
    instructor: {
      name: "James Whitmore, MBA",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
      bio: "Digital marketing expert with 15+ years of experience in SEO, SEM, and social media marketing.",
      email: "james@example.com",
    },
    badge: "Marketing",
    bgColor: "bg-blue-100",
    accentColor: "bg-orange-500",
    description:
      "Master the essential digital marketing skills needed to succeed in today's competitive landscape.",
    bonuses: [
      "Lifetime access to course materials",
      "Certificate of completion",
      "Interactive quizzes and assessments",
      "Downloadable resources",
      "Direct instructor support",
    ],
    courseInfo: {
      welcome:
        "Welcome to Master Digital Marketing Success! This comprehensive course will transform your marketing skills.",
      deliveryMode: "Online, Self-paced",
      program: "Professional Marketing Certification",
      expectedOutcomes: [
        "Master SEO and SEM strategies",
        "Create effective social media campaigns",
        "Optimize conversion rates",
        "Build profitable funnels",
        "Analyze marketing data effectively",
      ],
    },

    // Modules with lessons
    modules: [
      {
        id: 1,
        title: "Foundations of Digital Marketing",
        description:
          "Learn the basics of digital marketing and customer journey",
        xpReward: 310, // XP earned when module is completed
        lessons: [
          {
            id: 1,
            title: "Introduction to Digital Marketing",
            content:
              "Explore the digital marketing landscape and success mindset. Digital marketing encompasses all marketing efforts that use electronic devices or the internet. This includes channels such as search engines, social media, email, and websites to connect with current and prospective customers.",
            type: "video", // video, notes, or document
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            duration: "15 mins",
            xpReward: 50,
            topics: [
              "What is Digital Marketing",
              "Success Mindset",
              "Digital Trends 2024",
            ],
            questions: [
              {
                id: 1,
                type: "multiple_choice",
                question: "What is the primary goal of digital marketing?",
                options: [
                  "To increase brand awareness and conversions",
                  "To spend more money on ads",
                  "To create social media accounts",
                  "To hire more staff",
                ],
                correctAnswer: 0,
              },
              {
                id: 2,
                type: "open_ended",
                question:
                  "How would you define digital marketing in your own words?",
              },
            ],
          },
          {
            id: 2,
            title: "Customer Journey & Funnel",
            content:
              "Understanding how customers interact with your brand. The customer journey maps out the complete experience a customer has with your brand from awareness to post-purchase.",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            duration: "20 mins",
            xpReward: 60,
            topics: [
              "Customer Journey Stages",
              "Digital Funnel Basics",
              "Touchpoints",
            ],
            questions: [
              {
                id: 1,
                type: "multiple_choice",
                question: "How many main stages are in the customer journey?",
                options: ["2", "3", "4", "5"],
                correctAnswer: 2,
              },
            ],
          },
          {
            id: 3,
            title: "Digital Marketing Strategy Framework",
            content:
              "Learn how to develop a comprehensive digital marketing strategy that aligns with business goals. This framework will guide you through market research, target audience identification, and channel selection.",
            type: "notes",
            duration: "25 mins",
            xpReward: 70,
            topics: [
              "SWOT Analysis for Digital Marketing",
              "Setting SMART Goals",
              "Budget Allocation",
              "Channel Selection Strategy",
            ],
            notes: `
# Digital Marketing Strategy Framework

## 1. Market Research
Understanding your market is the foundation of any successful digital marketing strategy.

### Key Components:
- Industry trends analysis
- Competitor benchmarking
- Consumer behavior patterns
- Market size and growth potential

## 2. Target Audience Definition
Create detailed buyer personas to guide your marketing efforts.

### Persona Elements:
- Demographics (age, location, income)
- Psychographics (interests, values, lifestyle)
- Pain points and challenges
- Goals and aspirations
- Preferred communication channels

## 3. SMART Goals
Set Specific, Measurable, Achievable, Relevant, and Time-bound goals.

### Examples:
✓ Increase website traffic by 50% in 6 months
✓ Generate 100 qualified leads per month
✓ Improve conversion rate from 2% to 4% by Q4
✓ Grow social media following by 10,000 followers in 3 months

## 4. Budget Allocation
Distribute your budget strategically across channels.

### Recommended Split:
- Paid Advertising: 40%
- Content Creation: 25%
- Tools & Technology: 20%
- Analytics & Testing: 10%
- Training & Development: 5%

## 5. Channel Selection
Choose channels based on where your audience spends time.

### Primary Channels:
- Social Media (Facebook, Instagram, LinkedIn, Twitter)
- Search Engine Marketing (Google Ads, Bing Ads)
- Email Marketing
- Content Marketing (Blog, Video, Podcasts)
- SEO (Organic Search)

## Key Takeaways:
✓ Always start with research
✓ Know your audience deeply
✓ Set measurable goals
✓ Be strategic with budget
✓ Test and optimize continuously
            `,
            questions: [
              {
                id: 1,
                type: "multiple_choice",
                question: "What does SMART stand for in goal setting?",
                options: [
                  "Specific, Measurable, Achievable, Relevant, Time-bound",
                  "Simple, Manageable, Attainable, Realistic, Trackable",
                  "Strategic, Meaningful, Actionable, Results-driven, Timely",
                  "Smart, Modern, Advanced, Revolutionary, Tactical",
                ],
                correctAnswer: 0,
              },
              {
                id: 2,
                type: "multiple_choice",
                question:
                  "What percentage of budget is typically recommended for paid advertising?",
                options: ["20%", "30%", "40%", "50%"],
                correctAnswer: 2,
              },
            ],
          },
          {
            id: 4,
            title: "SEO Fundamentals (Reading Material)",
            content:
              "Master the basics of Search Engine Optimization to improve your organic visibility. This comprehensive guide covers on-page, off-page, and technical SEO.",
            type: "document",
            duration: "30 mins",
            xpReward: 80,
            documentUrl: "https://example.com/seo-guide.pdf", // Link to uploaded document
            topics: [
              "Keyword Research",
              "On-Page SEO",
              "Link Building",
              "Technical SEO",
            ],
            notes: `
# SEO Fundamentals Guide

## What is SEO?
Search Engine Optimization (SEO) is the practice of optimizing your website to rank higher in search engine results pages (SERPs).

## 1. Keyword Research
Finding the right keywords is crucial for SEO success.

### Tools to Use:
- Google Keyword Planner
- SEMrush
- Ahrefs
- Ubersuggest

### Keyword Types:
- **Short-tail**: 1-2 words (e.g., "marketing tips")
- **Long-tail**: 3+ words (e.g., "digital marketing tips for small businesses")
- **LSI Keywords**: Related terms that provide context

## 2. On-Page SEO
Optimize individual pages for target keywords.

### Key Elements:
✓ Title Tags (50-60 characters)
✓ Meta Descriptions (150-160 characters)
✓ Header Tags (H1, H2, H3)
✓ URL Structure (short, descriptive)
✓ Image Alt Text
✓ Internal Linking
✓ Content Quality (1,500+ words recommended)

## 3. Off-Page SEO
Build authority through external signals.

### Strategies:
- Link Building (guest posts, partnerships)
- Social Media Signals
- Brand Mentions
- Online Reviews
- Influencer Collaborations

## 4. Technical SEO
Ensure search engines can crawl and index your site.

### Checklist:
✓ Mobile-friendly design
✓ Fast page speed (under 3 seconds)
✓ SSL certificate (HTTPS)
✓ XML sitemap
✓ Robots.txt file
✓ Structured data markup
✓ Fix broken links

## 5. Content Strategy
Create valuable content that answers user queries.

### Content Types:
- Blog posts
- How-to guides
- Case studies
- Infographics
- Videos
- Podcasts

## SEO Best Practices:
1. Focus on user intent
2. Create comprehensive content
3. Optimize for mobile
4. Improve site speed
5. Build quality backlinks
6. Update content regularly
7. Monitor analytics

## Common SEO Mistakes to Avoid:
❌ Keyword stuffing
❌ Buying backlinks
❌ Duplicate content
❌ Ignoring mobile users
❌ Slow page speed
❌ Poor user experience

## Measuring SEO Success:
- Organic traffic growth
- Keyword rankings
- Backlink profile
- Domain authority
- Conversion rate
- Bounce rate
- Time on page
            `,
            questions: [
              {
                id: 1,
                type: "multiple_choice",
                question: "What is the recommended ideal page load speed?",
                options: [
                  "Under 1 second",
                  "Under 3 seconds",
                  "Under 5 seconds",
                  "Under 10 seconds",
                ],
                correctAnswer: 1,
              },
              {
                id: 2,
                type: "multiple_choice",
                question: "Which of these is NOT a component of on-page SEO?",
                options: [
                  "Title tags",
                  "Meta descriptions",
                  "Backlinks",
                  "Header tags",
                ],
                correctAnswer: 2,
              },
              {
                id: 3,
                type: "open_ended",
                question:
                  "Explain the difference between on-page and off-page SEO in your own words.",
              },
            ],
          },
        ],
        assessment: {
          id: 1,
          title: "Module 1 Assessment: Digital Marketing Foundations",
          type: "quiz",
          passingScore: 30, // Need 30% to proceed to next module
          questions: [
            {
              id: 1,
              type: "multiple_choice",
              question:
                "What are the three main stages of the customer funnel?",
              options: [
                "Awareness, Consideration, Decision",
                "Click, View, Buy",
                "Follow, Like, Share",
                "Email, SMS, Push",
              ],
              correctAnswer: 0,
            },
            {
              id: 2,
              type: "multiple_choice",
              question: "Which channel is best for brand awareness?",
              options: ["Social Media", "Email", "SMS", "Push Notifications"],
              correctAnswer: 0,
            },
            {
              id: 3,
              type: "multiple_choice",
              question: "What does the 'M' in SMART goals stand for?",
              options: ["Modern", "Measurable", "Manageable", "Meaningful"],
              correctAnswer: 1,
            },
            {
              id: 4,
              type: "multiple_choice",
              question: "Which is a long-tail keyword?",
              options: [
                "shoes",
                "running shoes",
                "best running shoes for marathon training",
                "footwear",
              ],
              correctAnswer: 2,
            },
            {
              id: 5,
              type: "multiple_choice",
              question: "What is the primary purpose of SEO?",
              options: [
                "To rank higher in search results",
                "To create more ads",
                "To send more emails",
                "To increase prices",
              ],
              correctAnswer: 0,
            },
          ],
        },
      },
      {
        id: 2,
        title: "Website & Landing Page Strategy",
        description: "Master website optimization and conversion strategies",
        xpReward: 420,
        lessons: [
          {
            id: 5,
            title: "Landing Page Fundamentals",
            content:
              "Create high-converting landing pages. A landing page is a standalone web page created specifically for marketing or advertising campaigns. Learn the essential elements that drive conversions.",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            duration: "25 mins",
            xpReward: 90,
            topics: [
              "Landing Page Elements",
              "Copywriting Basics",
              "CRO Principles",
              "A/B Testing",
            ],
            questions: [
              {
                id: 1,
                type: "multiple_choice",
                question:
                  "What is the most important element of a landing page?",
                options: [
                  "Clear headline and CTA",
                  "Fancy animations",
                  "Large images",
                  "Auto-playing music",
                ],
                correctAnswer: 0,
              },
              {
                id: 2,
                type: "multiple_choice",
                question: "What does CTA stand for?",
                options: [
                  "Call To Action",
                  "Click Through Advertising",
                  "Customer Traffic Analysis",
                  "Content Type Allocation",
                ],
                correctAnswer: 0,
              },
            ],
          },
          {
            id: 6,
            title: "Conversion Rate Optimization (CRO)",
            content:
              "Learn proven techniques to optimize your conversion rates and maximize ROI from your traffic. CRO is the systematic process of increasing the percentage of website visitors who take a desired action.",
            type: "notes",
            duration: "30 mins",
            xpReward: 100,
            topics: [
              "Understanding Conversion Funnel",
              "Heat Mapping & User Behavior",
              "A/B Testing Strategies",
              "Optimizing Forms",
            ],
            notes: `
# Conversion Rate Optimization (CRO) Guide

## What is CRO?
Conversion Rate Optimization is the process of improving your website to increase the percentage of visitors who complete desired actions.

## Key Metrics:
- **Conversion Rate** = (Conversions / Total Visitors) × 100
- **Bounce Rate**: Percentage who leave after viewing one page
- **Average Session Duration**: Time spent on site
- **Pages Per Session**: Number of pages viewed

## CRO Fundamentals

### 1. Understanding Your Funnel
Map out every step of your conversion funnel:
1. Landing Page Visit
2. Content Engagement
3. Action Initiation (click CTA)
4. Form Completion
5. Confirmation/Thank You

### 2. Analyzing User Behavior
Use tools to understand how users interact:
- **Heat Maps**: See where users click
- **Scroll Maps**: Track how far users scroll
- **Session Recordings**: Watch user journeys
- **Analytics**: Identify drop-off points

### 3. A/B Testing Best Practices

#### Elements to Test:
✓ Headlines
✓ CTA button color and text
✓ Images and videos
✓ Form length
✓ Page layout
✓ Copy and messaging
✓ Trust signals

#### Testing Process:
1. Identify problem areas
2. Form hypothesis
3. Create variations
4. Run test (minimum 2 weeks)
5. Analyze results
6. Implement winner

### 4. Landing Page Optimization

#### Above the Fold Must-Haves:
✓ Clear, compelling headline
✓ Subheadline that explains value
✓ Hero image or video
✓ Primary CTA button
✓ Trust indicators

#### Below the Fold:
✓ Benefits (not just features)
✓ Social proof (testimonials, reviews)
✓ Detailed explanation
✓ FAQ section
✓ Secondary CTA

### 5. Form Optimization

#### Best Practices:
- Keep forms short (3-5 fields ideal)
- Use single-column layout
- Clear field labels
- Inline validation
- Progress indicators for multi-step
- Mobile-friendly design

#### Fields to Include:
- Name (first name only if possible)
- Email (required)
- Additional fields only if necessary

### 6. Trust Building Elements

Include these to boost credibility:
✓ Customer testimonials
✓ Case studies
✓ Client logos
✓ Security badges
✓ Money-back guarantees
✓ Industry certifications
✓ Awards and recognition

### 7. Mobile Optimization

Mobile users behave differently:
- Larger CTA buttons
- Simplified navigation
- Fast loading speed
- Thumb-friendly design
- Click-to-call buttons

### 8. Copywriting for Conversions

#### Framework:
**AIDA Model:**
- **A**ttention: Grab with headline
- **I**nterest: Build with benefits
- **D**esire: Create urgency/scarcity
- **A**ction: Clear CTA

#### Power Words:
- Free
- New
- Proven
- Guaranteed
- Limited
- Exclusive
- Instant

### 9. Common CRO Mistakes

❌ Testing too many elements at once
❌ Ending tests too early
❌ Not segmenting data
❌ Ignoring mobile users
❌ Too many CTAs
❌ Slow page speed
❌ Complex forms

### 10. Quick Wins

Implement these for immediate impact:
1. Add urgency/scarcity (limited time)
2. Simplify your CTA
3. Improve page speed
4. Add social proof
5. Reduce form fields
6. Fix mobile issues
7. Add live chat

## CRO Tools:
- **Testing**: Google Optimize, Optimizely, VWO
- **Analytics**: Google Analytics, Hotjar
- **Heat Maps**: Crazy Egg, Hotjar
- **User Testing**: UserTesting, UsabilityHub

## Measuring Success:
- Conversion rate increase
- Revenue per visitor
- Average order value
- Customer lifetime value
- Return on ad spend (ROAS)

Remember: CRO is an ongoing process, not a one-time fix!
            `,
            questions: [
              {
                id: 1,
                type: "multiple_choice",
                question: "What does CRO stand for?",
                options: [
                  "Conversion Rate Optimization",
                  "Customer Relationship Organization",
                  "Creative Resource Output",
                  "Cost Reduction Operation",
                ],
                correctAnswer: 0,
              },
              {
                id: 2,
                type: "multiple_choice",
                question: "How long should you typically run an A/B test?",
                options: ["1 day", "1 week", "Minimum 2 weeks", "6 months"],
                correctAnswer: 2,
              },
              {
                id: 3,
                type: "open_ended",
                question:
                  "Name three elements you would test on a landing page to improve conversions.",
              },
            ],
          },
          {
            id: 7,
            title: "Web Analytics & Tracking",
            content:
              "Master Google Analytics and tracking implementation to measure your marketing success. Learn how to set up proper tracking and interpret data to make informed decisions.",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            duration: "35 mins",
            xpReward: 110,
            topics: [
              "Google Analytics Setup",
              "Goal Tracking",
              "UTM Parameters",
              "Custom Events",
              "Reporting & Dashboards",
            ],
            questions: [
              {
                id: 1,
                type: "multiple_choice",
                question: "What are UTM parameters used for?",
                options: [
                  "Tracking campaign sources and performance",
                  "Increasing page speed",
                  "Improving SEO rankings",
                  "Sending emails",
                ],
                correctAnswer: 0,
              },
              {
                id: 2,
                type: "multiple_choice",
                question: "What is a conversion goal in Google Analytics?",
                options: [
                  "A specific action you want users to complete",
                  "Your monthly revenue target",
                  "Number of page views",
                  "Social media followers",
                ],
                correctAnswer: 0,
              },
            ],
          },
        ],
        assessment: {
          id: 2,
          title: "Module 2 Assessment: Website Optimization",
          type: "quiz",
          passingScore: 30,
          questions: [
            {
              id: 1,
              type: "multiple_choice",
              question: "What does CRO stand for?",
              options: [
                "Conversion Rate Optimization",
                "Customer Relationship Organization",
                "Creative Resource Output",
                "Cost Reduction Operation",
              ],
              correctAnswer: 0,
            },
            {
              id: 2,
              type: "multiple_choice",
              question: "Which element is most important above the fold?",
              options: [
                "Clear headline and CTA",
                "Footer information",
                "FAQ section",
                "Long form content",
              ],
              correctAnswer: 0,
            },
            {
              id: 3,
              type: "multiple_choice",
              question:
                "What is the ideal number of form fields for conversion?",
              options: ["1-2", "3-5", "10-15", "20+"],
              correctAnswer: 1,
            },
            {
              id: 4,
              type: "multiple_choice",
              question: "What does UTM stand for in tracking?",
              options: [
                "Urchin Tracking Module",
                "Universal Tracking Method",
                "User Traffic Measurement",
                "Unified Tagging Mechanism",
              ],
              correctAnswer: 0,
            },
            {
              id: 5,
              type: "multiple_choice",
              question: "How long should you run an A/B test?",
              options: ["1 day", "3 days", "Minimum 2 weeks", "1 year"],
              correctAnswer: 2,
            },
          ],
        },
      },
    ],

    // Final Course Assessment (need 70% to get certificate)
    finalAssessment: {
      id: 99,
      title: "Final Course Assessment: Digital Marketing Mastery",
      description:
        "Complete this final assessment to earn your certificate. You need 70% or higher to pass.",
      passingScore: 70,
      questions: [
        {
          id: 1,
          type: "multiple_choice",
          question: "What are the three main stages of the customer journey?",
          options: [
            "Awareness, Consideration, Decision",
            "Like, Share, Subscribe",
            "Click, View, Purchase",
            "Search, Find, Buy",
          ],
          correctAnswer: 0,
        },
        {
          id: 2,
          type: "multiple_choice",
          question: "What is the primary goal of SEO?",
          options: [
            "To rank higher in search engine results",
            "To create more content",
            "To send more emails",
            "To increase social media followers",
          ],
          correctAnswer: 0,
        },
        {
          id: 3,
          type: "multiple_choice",
          question: "What does SMART stand for in goal setting?",
          options: [
            "Specific, Measurable, Achievable, Relevant, Time-bound",
            "Simple, Modern, Advanced, Real, Trackable",
            "Strategic, Meaningful, Accurate, Realistic, Timely",
            "Standard, Managed, Actionable, Results-driven, Tested",
          ],
          correctAnswer: 0,
        },
        {
          id: 4,
          type: "multiple_choice",
          question: "What is a long-tail keyword?",
          options: [
            "A specific 3+ word search phrase",
            "A single word keyword",
            "A branded keyword",
            "A keyword with high competition",
          ],
          correctAnswer: 0,
        },
        {
          id: 5,
          type: "multiple_choice",
          question:
            "What is the most important element above the fold on a landing page?",
          options: [
            "Clear headline and CTA",
            "Footer links",
            "Privacy policy",
            "Social media icons",
          ],
          correctAnswer: 0,
        },
        {
          id: 6,
          type: "multiple_choice",
          question: "What does CRO stand for?",
          options: [
            "Conversion Rate Optimization",
            "Customer Revenue Optimization",
            "Content Ranking Organization",
            "Click Rate Optimization",
          ],
          correctAnswer: 0,
        },
        {
          id: 7,
          type: "multiple_choice",
          question: "What is the recommended page load speed?",
          options: [
            "Under 3 seconds",
            "Under 10 seconds",
            "Under 30 seconds",
            "Under 1 minute",
          ],
          correctAnswer: 0,
        },
        {
          id: 8,
          type: "multiple_choice",
          question: "What are UTM parameters used for?",
          options: [
            "Tracking campaign performance",
            "Improving SEO",
            "Sending emails",
            "Creating social posts",
          ],
          correctAnswer: 0,
        },
        {
          id: 9,
          type: "multiple_choice",
          question: "How long should you run an A/B test?",
          options: ["Minimum 2 weeks", "1 day", "3 hours", "6 months"],
          correctAnswer: 0,
        },
        {
          id: 10,
          type: "multiple_choice",
          question:
            "What is the ideal number of form fields for best conversion?",
          options: ["3-5 fields", "10-15 fields", "20+ fields", "1 field"],
          correctAnswer: 0,
        },
      ],
    },

    // Certificate template info
    certificate: {
      template: "professional",
      signatories: [
        {
          name: "James Whitmore, MBA",
          title: "Course Instructor",
          signature: "signature-url",
        },
        {
          name: "Sarah Johnson",
          title: "Program Director",
          signature: "signature-url",
        },
      ],
    },
  },
];

export default coursesData;
