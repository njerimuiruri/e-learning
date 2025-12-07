# Email Template Usage Guide

## Instructor Approval Email Template

This template is used to notify instructors when their application has been approved by an admin.

### Template Variables

Replace the following placeholders with actual data before sending:

- `{{INSTRUCTOR_NAME}}` - Full name of the instructor (e.g., "Dr. Sarah Johnson")
- `{{EXPERTISE_AREA}}` - Instructor's area of expertise (e.g., "Digital Marketing & SEO")
- `{{INSTRUCTOR_EMAIL}}` - Instructor's email address
- `{{DASHBOARD_LINK}}` - Direct link to the instructor dashboard (e.g., "https://yourplatform.com/instructor")
- `{{PLATFORM_URL}}` - Main platform URL (e.g., "https://yourplatform.com")
- `{{HELP_CENTER_URL}}` - Help center URL (e.g., "https://yourplatform.com/help")
- `{{TERMS_URL}}` - Terms of service URL (e.g., "https://yourplatform.com/terms")

### Dashboard Link Structure

The dashboard link should include a token or authentication parameter that:

1. Automatically logs the instructor in (if they're not already logged in)
2. Redirects them to the instructor dashboard
3. May include a welcome message or onboarding flow

Example: `https://yourplatform.com/instructor?token={{VERIFICATION_TOKEN}}&welcome=true`

### Example Implementation (Node.js/Express)

```javascript
const sendInstructorApprovalEmail = async (instructorData) => {
  const fs = require("fs");
  const path = require("path");

  // Read the template
  let emailTemplate = fs.readFileSync(
    path.join(__dirname, "templates/emails/instructor-approval.html"),
    "utf8"
  );

  // Replace variables
  emailTemplate = emailTemplate
    .replace(
      "{{INSTRUCTOR_NAME}}",
      `${instructorData.firstName} ${instructorData.lastName}`
    )
    .replace("{{EXPERTISE_AREA}}", instructorData.expertise || "your field")
    .replace("{{INSTRUCTOR_EMAIL}}", instructorData.email)
    .replace(
      "{{DASHBOARD_LINK}}",
      `${process.env.PLATFORM_URL}/instructor?approved=true`
    )
    .replace(/{{PLATFORM_URL}}/g, process.env.PLATFORM_URL)
    .replace("{{HELP_CENTER_URL}}", `${process.env.PLATFORM_URL}/help`)
    .replace("{{TERMS_URL}}", `${process.env.PLATFORM_URL}/terms`);

  // Send email using your email service (e.g., SendGrid, Nodemailer)
  await sendEmail({
    to: instructorData.email,
    subject: "🎉 Your Instructor Application Has Been Approved!",
    html: emailTemplate,
  });
};
```

### Testing the Email

You can preview the email by:

1. Opening `instructor-approval.html` in a browser
2. Using an email testing tool like [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/)
3. Sending a test email to yourself

### Admin Dashboard Integration

When an admin approves an instructor from the admin dashboard:

```javascript
// In your admin approval handler
const approveInstructor = async (instructorId) => {
  // Update instructor status in database
  await updateInstructor(instructorId, {
    approved: true,
    status: "approved",
    approvedAt: new Date(),
  });

  // Get instructor data
  const instructor = await getInstructor(instructorId);

  // Send approval email
  await sendInstructorApprovalEmail(instructor);

  return { success: true, message: "Instructor approved and notified" };
};
```

### Email Service Configuration

Make sure to configure your email service in your environment variables:

```env
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your_api_key
EMAIL_FROM=noreply@yourplatform.com
EMAIL_FROM_NAME=E-Learning Platform
PLATFORM_URL=https://yourplatform.com
```

### Customization

Feel free to customize:

- Colors (currently using green theme: #16a34a)
- Logo (add your platform logo in the header)
- Footer links
- Additional sections or information
- Button styling

### Best Practices

1. **Personalization**: Always use the instructor's actual name and details
2. **Clear CTA**: The "Access Instructor Dashboard" button should be prominent
3. **Mobile Responsive**: The template is responsive, test on mobile devices
4. **Testing**: Always test with real email clients (Gmail, Outlook, etc.)
5. **Security**: Never include sensitive information in the email
6. **Tracking**: Consider adding email open tracking if needed

### Troubleshooting

**Email not rendering correctly?**

- Check that all template variables are replaced
- Test in multiple email clients
- Verify email service configuration

**Button link not working?**

- Ensure PLATFORM_URL is set correctly
- Check that the instructor's account is actually approved in the database
- Verify the instructor layout properly checks the approval status
