def base_email_template(
    title: str,
    subtitle: str,
    content: str,
    button_text: str | None = None,
    button_link: str | None = None,
) -> str:

    button_html = ""

    if button_text and button_link:
        button_html = f"""
        <a
            href="{button_link}"
            style="
                display:inline-block;
                margin-top:32px;
                padding:14px 28px;
                border-radius:16px;
                background:linear-gradient(135deg,#7c3aed,#a855f7);
                color:white;
                text-decoration:none;
                font-weight:700;
                font-size:15px;
                box-shadow:0 0 25px rgba(168,85,247,0.45);
            "
        >
            {button_text}
        </a>
        """

    return f"""
    <div
        style="
            background:#050507;
            padding:40px 20px;
            font-family:Arial,sans-serif;
            color:white;
        "
    >
        <div
            style="
                max-width:620px;
                margin:0 auto;
                background:linear-gradient(
                    135deg,
                    rgba(20,20,35,1) 0%,
                    rgba(35,20,55,1) 100%
                );
                border:1px solid rgba(168,85,247,0.2);
                border-radius:28px;
                overflow:hidden;
                box-shadow:0 0 40px rgba(124,58,237,0.18);
            "
        >

            <div
                style="
                    padding:36px;
                    border-bottom:1px solid rgba(168,85,247,0.12);
                "
            >
                <div
                    style="
                        color:#a855f7;
                        font-size:13px;
                        letter-spacing:4px;
                        font-weight:700;
                        margin-bottom:14px;
                    "
                >
                    CODEFORGE
                </div>

                <h1
                    style="
                        margin:0;
                        font-size:38px;
                        line-height:1.1;
                        font-weight:900;
                    "
                >
                    {title}
                </h1>

                <p
                    style="
                        margin-top:16px;
                        color:#b7b7c9;
                        font-size:16px;
                        line-height:1.7;
                    "
                >
                    {subtitle}
                </p>

                {content}

                {button_html}
            </div>

            <div
                style="
                    padding:24px 36px;
                    background:#09090f;
                    color:#777;
                    font-size:13px;
                    line-height:1.7;
                "
            >
                CodeForge • Proof-based execution platform for developers
            </div>
        </div>
    </div>
    """


def verification_email_template(code: str) -> str:
    return base_email_template(
        title="Verify your email",
        subtitle="Complete your CodeForge account setup.",
        content=f"""
        <div
            style="
                margin-top:28px;
                padding:28px;
                border-radius:22px;
                background:rgba(168,85,247,0.08);
                border:1px solid rgba(168,85,247,0.16);
                text-align:center;
            "
        >
            <div
                style="
                    font-size:46px;
                    font-weight:900;
                    letter-spacing:12px;
                    color:#c084fc;
                "
            >
                {code}
            </div>

            <div
                style="
                    margin-top:14px;
                    color:#999;
                    font-size:14px;
                "
            >
                Code expires in 15 minutes
            </div>
        </div>
        """,
    )


def reset_password_email_template(reset_link: str) -> str:
    return base_email_template(
        title="Reset your password",
        subtitle="Click the button below to create a new password.",
        content="""
        <div
            style="
                margin-top:20px;
                color:#b7b7c9;
                font-size:15px;
                line-height:1.7;
            "
        >
            This reset link expires in 1 hour.
        </div>
        """,
        button_text="Reset Password",
        button_link=reset_link,
    )


def payment_success_email_template(
    tier_name: str,
) -> str:
    return base_email_template(
        title="Payment successful",
        subtitle=f"You now have access to CodeForge {tier_name}.",
        content="""
        <div
            style="
                margin-top:24px;
                padding:22px;
                border-radius:20px;
                background:rgba(34,197,94,0.08);
                border:1px solid rgba(34,197,94,0.18);
                color:#d1fae5;
                line-height:1.7;
            "
        >
            Your subscription is now active and all premium features are unlocked.
        </div>
        """,
        button_text="Open CodeForge",
        button_link="https://codeforgeapp.com",
    )


def beta_welcome_email_template() -> str:
    return base_email_template(
        title="Welcome to the beta",
        subtitle="You are now one of the first CodeForge users.",
        content="""
        <div
            style="
                margin-top:24px;
                color:#b7b7c9;
                line-height:1.8;
                font-size:15px;
            "
        >
            Thank you for supporting CodeForge early.
            Your feedback directly shapes the platform.
        </div>
        """,
        button_text="Start Executing",
        button_link="https://codeforgeapp.com",
    )