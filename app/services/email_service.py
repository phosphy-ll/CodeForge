import smtplib
from email.mime.text import MIMEText

from app.core.config import get_settings

settings = get_settings()


class EmailService:
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
    ) -> None:

        msg = MIMEText(body, "html")

        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email

        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
        ) as server:

            server.starttls()

            server.login(
                settings.SMTP_USER,
                settings.SMTP_PASSWORD,
            )

            server.send_message(msg)