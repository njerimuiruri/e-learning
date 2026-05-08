/**
 * Builds a beautiful HTML reminder email for a fellow.
 * Degrades gracefully in email clients that don't support CSS animations.
 */
export function buildReminderEmail({ name, modules = [], overallProgress = 0, personalNote = '' }) {
  const incomplete = modules.filter((m) => m.progress < 100);
  const current = incomplete[0];
  const firstName = name?.split(' ')[0] || name || 'Fellow';

  const progressGradient =
    overallProgress >= 75
      ? 'linear-gradient(90deg,#10b981,#059669)'
      : overallProgress >= 40
      ? 'linear-gradient(90deg,#f59e0b,#d97706)'
      : 'linear-gradient(90deg,#6366f1,#8b5cf6)';

  const moduleRows = incomplete
    .map(
      (m) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#1e293b;">
                  ${m.order ? `Module ${m.order}: ` : ''}${m.title}
                </p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">
                  ${m.completedLessons} / ${m.totalLessons} lessons &nbsp;·&nbsp; ${m.progress}% done
                </p>
              </td>
              <td width="130" style="padding-left:16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#e2e8f0;border-radius:99px;height:8px;overflow:hidden;">
                      <div style="background:${progressGradient};width:${m.progress}%;height:8px;border-radius:99px;"></div>
                    </td>
                  </tr>
                </table>
                <p style="margin:4px 0 0;font-size:11px;color:#6366f1;font-weight:700;text-align:right;">${m.progress}%</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Learning Reminder</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    /* Animations — supported by Gmail, Apple Mail, Outlook.com */
    @keyframes fadeDown {
      from { opacity: 0; transform: translateY(-24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes float {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-8px); }
    }
    @keyframes pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.35); }
      50%      { box-shadow: 0 0 0 14px rgba(99,102,241,0); }
    }

    .header-title  { animation: fadeDown 0.7s ease-out both; }
    .header-sub    { animation: fadeDown 0.9s ease-out both; }
    .icon-wrap     { animation: float 3s ease-in-out infinite; }
    .badge-wrap    { animation: scaleIn 0.6s 0.3s ease-out both; }
    .body-content  { animation: fadeUp 0.7s 0.2s ease-out both; }
    .cta-btn       { animation: pulse 2.5s 1.5s infinite; }

    .shimmer-bar {
      background: linear-gradient(90deg, #6366f1 0%, #a78bfa 40%, #6366f1 80%);
      background-size: 400px 100%;
      animation: shimmer 2.5s linear infinite;
    }

    @media only screen and (max-width: 620px) {
      .email-wrap  { width: 100% !important; }
      .email-body  { padding: 24px 20px !important; }
      .header-pad  { padding: 36px 20px 28px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:'Inter',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;padding:40px 16px;">
  <tr>
    <td align="center">

      <table class="email-wrap" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;
                    overflow:hidden;box-shadow:0 20px 60px rgba(99,102,241,0.18);">

        <!-- ░░░ HEADER ░░░ -->
        <tr>
          <td class="header-pad"
              style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%);
                     padding:48px 40px 36px;text-align:center;">

            <!-- ARIN Logo -->
            <div class="icon-wrap"
                 style="display:inline-block;margin-bottom:20px;">
              <img
                src="https://elearning.arin-africa.org/Arin.png"
                alt="ARIN"
                width="80"
                style="display:block;border-radius:12px;
                       box-shadow:0 4px 20px rgba(0,0,0,0.25);
                       border:3px solid rgba(255,255,255,0.4);"
              />
            </div>

            <!-- Organisation name under logo -->
            <p style="color:rgba(255,255,255,0.75);margin:0 0 16px;font-size:12px;
                      font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">
              Africa Research &amp; Impact Network
            </p>

            <h1 class="header-title"
                style="color:#ffffff;margin:0 0 10px;font-size:30px;font-weight:800;
                       letter-spacing:-0.5px;text-shadow:0 2px 12px rgba(0,0,0,0.2);">
              Keep Going, ${firstName}! 🚀
            </h1>
            <p class="header-sub"
               style="color:rgba(255,255,255,0.88);margin:0;font-size:16px;font-weight:400;">
              Your learning journey is waiting — you're closer than you think.
            </p>
          </td>
        </tr>

        <!-- ░░░ PROGRESS BADGE ░░░ -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);
                     padding:0 40px 36px;text-align:center;">
            <div class="badge-wrap"
                 style="display:inline-block;background:rgba(255,255,255,0.12);
                        border:2px solid rgba(255,255,255,0.35);border-radius:999px;
                        padding:12px 32px;">
              <span style="color:#ffffff;font-size:26px;font-weight:800;">${overallProgress}%</span>
              <span style="color:rgba(255,255,255,0.8);font-size:13px;margin-left:8px;">
                overall progress
              </span>
            </div>

            <!-- Animated progress bar -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="margin-top:16px;max-width:380px;margin-left:auto;margin-right:auto;">
              <tr>
                <td style="background:rgba(255,255,255,0.2);border-radius:99px;
                           height:10px;overflow:hidden;">
                  <div class="shimmer-bar"
                       style="width:${overallProgress}%;height:10px;border-radius:99px;">
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ░░░ BODY ░░░ -->
        <tr>
          <td class="email-body body-content" style="padding:40px;">

            <!-- Greeting -->
            <p style="margin:0 0 8px;font-size:19px;font-weight:700;color:#0f172a;">
              Dear ${name},
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.75;">
              We wanted to reach out and let you know that your progress has been noticed —
              and we believe in your ability to finish strong!
              You're <strong style="color:#6366f1;">${overallProgress}%</strong> of the way through
              the programme. Don't stop now. 💪
            </p>

            ${personalNote
              ? `<div style="background:#fefce8;border-left:4px solid #eab308;
                            border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 28px;">
                   <p style="margin:0 0 4px;font-size:12px;font-weight:700;
                              text-transform:uppercase;letter-spacing:1px;color:#a16207;">
                     📝 A note from your coordinator
                   </p>
                   <p style="margin:0;font-size:14px;color:#713f12;line-height:1.65;
                              font-style:italic;">"${personalNote}"</p>
                 </div>`
              : ''}

            <!-- Current module highlight -->
            ${current
              ? `<div style="background:linear-gradient(135deg,#eef2ff,#f5f3ff);
                            border:1px solid #c7d2fe;border-radius:20px;padding:28px;
                            margin:0 0 28px;">
                   <p style="margin:0 0 6px;font-size:11px;font-weight:700;
                              text-transform:uppercase;letter-spacing:1.2px;color:#7c3aed;">
                     📖 Continue where you left off
                   </p>
                   <p style="margin:0 0 16px;font-size:19px;font-weight:800;color:#1e1b4b;
                              line-height:1.3;">
                     ${current.order ? `Module ${current.order}: ` : ''}${current.title}
                   </p>
                   <table width="100%" cellpadding="0" cellspacing="0">
                     <tr>
                       <td style="background:#ddd6fe;border-radius:99px;height:12px;overflow:hidden;">
                         <div style="background:linear-gradient(90deg,#6366f1,#a855f7);
                                     width:${current.progress}%;height:12px;border-radius:99px;">
                         </div>
                       </td>
                       <td width="48" align="right" style="padding-left:12px;">
                         <span style="font-size:14px;font-weight:800;color:#7c3aed;">
                           ${current.progress}%
                         </span>
                       </td>
                     </tr>
                   </table>
                   <p style="margin:10px 0 0;font-size:13px;color:#6d28d9;font-weight:500;">
                     ${current.completedLessons} of ${current.totalLessons} lessons completed
                   </p>
                 </div>`
              : ''}

            <!-- All incomplete modules -->
            ${incomplete.length > 1
              ? `<p style="margin:0 0 10px;font-size:12px;font-weight:700;
                           text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">
                   Modules still in progress
                 </p>
                 <table width="100%" cellpadding="0" cellspacing="0"
                        style="border:1px solid #e2e8f0;border-radius:16px;
                               overflow:hidden;margin:0 0 32px;padding:0 20px;">
                   <tbody style="display:block;padding:0 20px;">
                     ${moduleRows}
                   </tbody>
                 </table>`
              : '<div style="height:8px;"></div>'}

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 36px;">
              <tr>
                <td align="center">
                  <a href="#" class="cta-btn"
                     style="display:inline-block;
                            background:linear-gradient(135deg,#4f46e5,#7c3aed);
                            color:#ffffff;text-decoration:none;
                            padding:18px 52px;border-radius:999px;
                            font-size:16px;font-weight:700;letter-spacing:0.3px;
                            box-shadow:0 8px 28px rgba(99,102,241,0.45);">
                    Continue Learning &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.7;">
              Every lesson completed is a step closer to your certificate of completion. 🏆<br/>
              We're cheering you on every step of the way!
            </p>
          </td>
        </tr>

        <!-- ░░░ DIVIDER ░░░ -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);"></div>
          </td>
        </tr>

        <!-- ░░░ FOOTER ░░░ -->
        <tr>
          <td style="background:#f8fafc;padding:32px 40px 28px;text-align:center;
                     border-radius:0 0 24px 24px;">
            <!-- ARIN Logo -->
            <img
              src="https://elearning.arin-africa.org/Arin.png"
              alt="ARIN"
              width="72"
              style="display:block;margin:0 auto 12px;border-radius:8px;
                     box-shadow:0 2px 8px rgba(0,0,0,0.08);"
            />
            <p style="margin:0 0 2px;font-size:15px;font-weight:800;color:#1e293b;
                      letter-spacing:-0.2px;">
              Africa Research &amp; Impact Network
            </p>
            <p style="margin:0 0 12px;font-size:12px;color:#64748b;font-weight:500;">
              ARIN Learning Programme
            </p>
            <div style="height:1px;background:#e2e8f0;margin:0 auto 12px;max-width:200px;"></div>
            <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.7;">
              You're receiving this because you're enrolled in the ARIN Learning Programme.<br/>
              For any questions, please reach out to your programme coordinator.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

/**
 * Builds the plain-text MESSAGE BODY sent to the backend's sendFellowReminder endpoint.
 *
 * IMPORTANT: The backend template already adds:
 *   - "Arin Publishing Academy" branded header
 *   - "Dear Fellow," greeting line
 * So we start directly with the body content — no duplicate greeting, no HTML.
 */
export function buildReminderMessage({ name, modules = [], overallProgress = 0, personalNote = '' }) {
  const firstName = name?.split(' ')[0] || name || 'there';
  const incomplete = modules.filter((m) => m.progress < 100);
  const current = incomplete[0];

  const lines = [];

  // Opening — flows naturally after the backend's "Dear Fellow," line
  lines.push(
    personalNote.trim() ||
      `We noticed you've been making great progress on your learning journey, ${firstName} — and we want to make sure you finish strong! 💪`,
  );
  lines.push('');
  lines.push(`You're currently at ${overallProgress}% overall progress. Here's a quick snapshot:`);
  lines.push('');
  lines.push(`YOUR PROGRESS: ${buildTextProgressBar(overallProgress)}`);
  lines.push('');

  if (current) {
    lines.push(`▶  CONTINUE WHERE YOU LEFT OFF`);
    lines.push(`   ${current.order ? `Module ${current.order}: ` : ''}${current.title}`);
    lines.push(`   ${current.progress}% complete — ${current.completedLessons} of ${current.totalLessons} lessons done`);
    lines.push('');
  }

  if (incomplete.length > 1) {
    lines.push(`📋 ALL MODULES IN PROGRESS`);
    incomplete.forEach((m) => {
      lines.push(`   • ${m.order ? `Module ${m.order}: ` : ''}${m.title}  —  ${m.progress}%`);
      lines.push(`     ${buildTextProgressBar(m.progress, 15)}`);
    });
    lines.push('');
  }

  lines.push(`Every lesson brings you one step closer to your Certificate of Completion. 🏆`);
  lines.push(`Log in to your learning portal to pick up where you left off.`);
  lines.push('');
  lines.push(`We're rooting for you!`);
  lines.push('');
  lines.push(`Warm regards,`);
  lines.push(`Africa Research & Impact Network (ARIN)`);

  return lines.join('\n');
}

function buildTextProgressBar(percent, width = 20) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent}%`;
}

/** Plain-text fallback (kept for backwards compat) */
export function buildReminderText(opts) {
  return buildReminderMessage(opts);
}
