import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.config_apis import api_keys

logger = logging.getLogger(__name__)


def build_resolution_html(
    ticket_id: str,
    road_name: str,
    reported_date: str,
    completed_date: str,
    before_image_url: str,
    after_image_url: str,
    authority_name: str = "Kerala Public Works Department",
) -> str:
    """Generates modern, responsive HTML email displaying side-by-side Before vs After repair proof."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kerala PWD Road Repair Verification</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
    .container {{ max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }}
    .header {{ background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 24px; text-align: center; }}
    .header h1 {{ margin: 0; font-size: 20px; color: #ffffff; letter-spacing: -0.5px; }}
    .header p {{ margin: 4px 0 0; font-size: 12px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }}
    .content {{ padding: 24px; }}
    .badge {{ display: inline-block; background-color: #064e3b; color: #34d399; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid #059669; }}
    .road-title {{ font-size: 18px; font-weight: 700; color: #ffffff; margin: 12px 0 4px; }}
    .gallery {{ display: flex; gap: 12px; margin: 20px 0; }}
    .photo-card {{ flex: 1; background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; overflow: hidden; text-align: center; }}
    .photo-card img {{ width: 100%; height: 180px; object-fit: cover; display: block; }}
    .photo-label {{ padding: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }}
    .label-before {{ color: #f87171; background-color: #450a0a; }}
    .label-after {{ color: #34d399; background-color: #064e3b; }}
    .details-box {{ background-color: #0f172a; border-radius: 12px; padding: 14px; font-size: 12px; border: 1px solid #334155; margin-top: 16px; }}
    .details-row {{ display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #1e293b; }}
    .details-row:last-child {{ border-bottom: none; }}
    .footer {{ padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Road Distress Resolved &amp; Verified</h1>
      <p>{authority_name}</p>
    </div>
    <div class="content">
      <span class="badge">&#10003; RESOLUTION CERTIFIED</span>
      <h2 class="road-title">{road_name}</h2>
      <p style="font-size: 13px; color: #94a3b8; margin: 0 0 16px;">
        The road defect reported under Ticket <strong>#{ticket_id}</strong> has been restored by municipal field teams.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
        <tr>
          <td width="48%" style="vertical-align: top; background: #0f172a; border-radius: 10px; border: 1px solid #334155; overflow: hidden;">
            <div style="background: #450a0a; color: #f87171; font-size: 10px; font-weight: 700; padding: 6px; text-align: center;">🔴 BEFORE (REPORTED)</div>
            <img src="{before_image_url}" alt="Before Repair" style="width: 100%; height: 160px; object-fit: cover; display: block;" />
          </td>
          <td width="4%"></td>
          <td width="48%" style="vertical-align: top; background: #0f172a; border-radius: 10px; border: 1px solid #334155; overflow: hidden;">
            <div style="background: #064e3b; color: #34d399; font-size: 10px; font-weight: 700; padding: 6px; text-align: center;">🟢 AFTER (RESTORED)</div>
            <img src="{after_image_url}" alt="After Repair" style="width: 100%; height: 160px; object-fit: cover; display: block;" />
          </td>
        </tr>
      </table>

      <div class="details-box">
        <div class="details-row"><span style="color: #64748b;">Ticket Reference</span><strong>#{ticket_id}</strong></div>
        <div class="details-row"><span style="color: #64748b;">Date Registered</span><span>{reported_date}</span></div>
        <div class="details-row"><span style="color: #64748b;">Repair Completed</span><span style="color: #34d399; font-weight: 600;">{completed_date}</span></div>
        <div class="details-row"><span style="color: #64748b;">Road Corridor</span><span>{road_name}</span></div>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for contributing to safer Kerala road infrastructure.</p>
      <p style="margin: 4px 0 0;">Government of Kerala · Public Works Department · IRC:SP:63 Standards</p>
    </div>
  </div>
</body>
</html>"""


def send_resolution_email(
    recipient_email: str,
    ticket_id: str,
    road_name: str,
    before_image: str,
    after_image: str,
    reported_date: str,
    completed_date: str,
) -> bool:
    """
    Sends transactional repair resolution email to citizen with before/after photos.
    Uses Gmail SMTP if credentials provided; otherwise logs payload cleanly without failing.
    """
    subject = f"Road Distress Resolved: Ticket #{ticket_id} [{road_name}]"

    # Base URL for media paths
    base_url = os.getenv("APP_PUBLIC_URL", "http://localhost:8000")
    before_url = f"{base_url}{before_image}" if before_image.startswith("/") else before_image
    after_url = f"{base_url}{after_image}" if after_image.startswith("/") else after_image

    html_content = build_resolution_html(
        ticket_id=ticket_id,
        road_name=road_name,
        reported_date=reported_date,
        completed_date=completed_date,
        before_image_url=before_url,
        after_image_url=after_url,
        authority_name=api_keys.REGION_AUTHORITY,
    )

    # Check if SMTP credentials configured
    smtp_user = api_keys.SMTP_USER
    smtp_pass = api_keys.SMTP_APP_PASSWORD

    if not smtp_user or not smtp_pass or "your_email" in smtp_user or "your_16_char" in smtp_pass:
        logger.info(
            f"[mailer.send_resolution_email] SMTP credentials unconfigured or default placeholder. "
            f"Simulating email delivery for Ticket #{ticket_id} to {recipient_email}. (No action needed)."
        )
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{api_keys.EMAIL_FROM_NAME} <{api_keys.EMAIL_FROM_ADDRESS}>"
        msg["To"] = recipient_email

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(api_keys.SMTP_HOST, api_keys.SMTP_PORT, timeout=15)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()

        logger.info(f"[mailer.send_resolution_email] Successfully delivered resolution email for ticket {ticket_id} to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"[mailer.send_resolution_email] Failed to send email via SMTP: {e}")
        return False

