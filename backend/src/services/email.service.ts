import { logger } from '../utils/logger';
import { ExternalServiceError, ValidationError } from '../utils/errors';
import { EMAIL_CONSTANTS } from '../utils/constants';
import appConfig from '../config/app.config';

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  from?: EmailRecipient;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailResult {
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
  error?: string;
}

export interface EmailStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
}

export class EmailService {
  private isConfigured: boolean;
  private provider: string;

  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'console';
    this.isConfigured = this.checkConfiguration();
  }

  /**
   * Check if email service is properly configured
   */
  private checkConfiguration(): boolean {
    if (this.provider === 'console') {
      return true; // Console provider is always available
    }

    // Check for required environment variables based on provider
    switch (this.provider) {
      case 'sendgrid':
        return !!process.env.SENDGRID_API_KEY;
      case 'ses':
        return !!(
          process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        );
      case 'smtp':
        return !!(process.env.SMTP_HOST && process.env.SMTP_PORT);
      default:
        return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Validate options
      this.validateEmailOptions(options);

      // If email features are disabled or not configured, use console output
      if (!this.isConfigured || !process.env.FEATURE_EMAIL) {
        return this.sendToConsole(options);
      }

      // Choose provider
      switch (this.provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(options);
        case 'ses':
          return await this.sendWithSES(options);
        case 'smtp':
          return await this.sendWithSMTP(options);
        default:
          return this.sendToConsole(options);
      }
    } catch (error) {
      logger.error('Failed to send email', {
        error,
        to: options.to,
        subject: options.subject,
      });

      return {
        messageId: 'failed',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<EmailResult> {
    const template = this.getTemplate(EMAIL_CONSTANTS.TEMPLATES.WELCOME);

    return await this.sendEmail({
      to: { email: user.email, name: `${user.firstName} ${user.lastName}` },
      subject: template.subject,
      html: this.renderTemplate(template.htmlContent, {
        firstName: user.firstName,
        lastName: user.lastName,
        appName: 'ConnectKit',
      }),
      template: EMAIL_CONSTANTS.TEMPLATES.WELCOME,
      templateData: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tags: ['welcome', 'user-onboarding'],
    });
  }

  /**
   * Send email verification email
   */
  async sendEmailVerification(
    user: { email: string; firstName: string },
    verificationToken: string
  ): Promise<EmailResult> {
    const template = this.getTemplate(
      EMAIL_CONSTANTS.TEMPLATES.EMAIL_VERIFICATION
    );
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    return await this.sendEmail({
      to: { email: user.email, name: user.firstName },
      subject: template.subject,
      html: this.renderTemplate(template.htmlContent, {
        firstName: user.firstName,
        verificationUrl,
        appName: 'ConnectKit',
      }),
      template: EMAIL_CONSTANTS.TEMPLATES.EMAIL_VERIFICATION,
      templateData: {
        firstName: user.firstName,
        verificationUrl,
      },
      tags: ['verification', 'auth'],
      priority: 'high',
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    user: { email: string; firstName: string },
    resetToken: string
  ): Promise<EmailResult> {
    const template = this.getTemplate(EMAIL_CONSTANTS.TEMPLATES.PASSWORD_RESET);
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    return await this.sendEmail({
      to: { email: user.email, name: user.firstName },
      subject: template.subject,
      html: this.renderTemplate(template.htmlContent, {
        firstName: user.firstName,
        resetUrl,
        appName: 'ConnectKit',
      }),
      template: EMAIL_CONSTANTS.TEMPLATES.PASSWORD_RESET,
      templateData: {
        firstName: user.firstName,
        resetUrl,
      },
      tags: ['password-reset', 'auth'],
      priority: 'high',
    });
  }

  /**
   * Send password changed confirmation
   */
  async sendPasswordChangedEmail(user: {
    email: string;
    firstName: string;
  }): Promise<EmailResult> {
    const template = this.getTemplate(
      EMAIL_CONSTANTS.TEMPLATES.PASSWORD_CHANGED
    );

    return await this.sendEmail({
      to: { email: user.email, name: user.firstName },
      subject: template.subject,
      html: this.renderTemplate(template.htmlContent, {
        firstName: user.firstName,
        appName: 'ConnectKit',
        supportUrl: `${process.env.FRONTEND_URL}/support`,
      }),
      template: EMAIL_CONSTANTS.TEMPLATES.PASSWORD_CHANGED,
      templateData: {
        firstName: user.firstName,
      },
      tags: ['password-changed', 'security'],
    });
  }

  /**
   * Send account locked notification
   */
  async sendAccountLockedEmail(
    user: { email: string; firstName: string },
    lockedUntil: Date
  ): Promise<EmailResult> {
    const template = this.getTemplate(EMAIL_CONSTANTS.TEMPLATES.ACCOUNT_LOCKED);

    return await this.sendEmail({
      to: { email: user.email, name: user.firstName },
      subject: template.subject,
      html: this.renderTemplate(template.htmlContent, {
        firstName: user.firstName,
        lockedUntil: lockedUntil.toLocaleString(),
        supportUrl: `${process.env.FRONTEND_URL}/support`,
        appName: 'ConnectKit',
      }),
      template: EMAIL_CONSTANTS.TEMPLATES.ACCOUNT_LOCKED,
      templateData: {
        firstName: user.firstName,
        lockedUntil,
      },
      tags: ['security', 'account-locked'],
      priority: 'high',
    });
  }

  /**
   * Send login alert email
   */
  async sendLoginAlertEmail(
    user: { email: string; firstName: string },
    loginInfo: { ip: string; userAgent: string; location?: string }
  ): Promise<EmailResult> {
    const template = this.getTemplate(EMAIL_CONSTANTS.TEMPLATES.LOGIN_ALERT);

    return await this.sendEmail({
      to: { email: user.email, name: user.firstName },
      subject: template.subject,
      html: this.renderTemplate(template.htmlContent, {
        firstName: user.firstName,
        loginTime: new Date().toLocaleString(),
        ipAddress: loginInfo.ip,
        userAgent: loginInfo.userAgent,
        location: loginInfo.location || 'Unknown',
        appName: 'ConnectKit',
      }),
      template: EMAIL_CONSTANTS.TEMPLATES.LOGIN_ALERT,
      templateData: {
        firstName: user.firstName,
        loginInfo,
      },
      tags: ['security', 'login-alert'],
    });
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    // Process emails in batches to avoid overwhelming the service
    const batchSize = 50;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(email => this.sendEmail(email))
      );

      results.push(...batchResults);

      // Add delay between batches to avoid rate limits
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Validate email options
   */
  private validateEmailOptions(options: EmailOptions): void {
    if (!options.to) {
      throw new ValidationError('Email recipient is required');
    }

    if (!options.subject) {
      throw new ValidationError('Email subject is required');
    }

    if (!options.html && !options.text && !options.template) {
      throw new ValidationError(
        'Email content is required (html, text, or template)'
      );
    }

    // Validate email addresses
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    for (const recipient of recipients) {
      if (!this.isValidEmail(recipient.email)) {
        throw new ValidationError(`Invalid email address: ${recipient.email}`);
      }
    }
  }

  /**
   * Validate email address
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Console email sender (for development/testing)
   */
  private sendToConsole(options: EmailOptions): EmailResult {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    console.log('\n===== EMAIL =====');
    console.log('From:', options.from?.email || EMAIL_CONSTANTS.FROM_ADDRESS);
    console.log(
      'To:',
      recipients.map(r => `${r.name || ''} <${r.email}>`).join(', ')
    );
    console.log('Subject:', options.subject);
    console.log('Template:', options.template || 'none');
    console.log('Tags:', options.tags?.join(', ') || 'none');

    if (options.text) {
      console.log('\n--- TEXT CONTENT ---');
      console.log(options.text);
    }

    if (options.html) {
      console.log('\n--- HTML CONTENT ---');
      console.log(options.html);
    }

    console.log('================\n');

    logger.info('Email sent to console', {
      to: recipients.map(r => r.email),
      subject: options.subject,
      template: options.template,
    });

    return {
      messageId: `console-${Date.now()}`,
      status: 'sent',
    };
  }

  /**
   * SendGrid email sender
   */
  private async sendWithSendGrid(options: EmailOptions): Promise<EmailResult> {
    try {
      // This is a placeholder implementation
      // In a real application, you would use the SendGrid SDK

      logger.info('Email would be sent via SendGrid', {
        to: options.to,
        subject: options.subject,
      });

      return {
        messageId: `sendgrid-${Date.now()}`,
        status: 'sent',
      };
    } catch (error) {
      throw new ExternalServiceError(
        'SendGrid',
        'Failed to send email via SendGrid',
        { error }
      );
    }
  }

  /**
   * AWS SES email sender
   */
  private async sendWithSES(options: EmailOptions): Promise<EmailResult> {
    try {
      // This is a placeholder implementation
      // In a real application, you would use the AWS SDK

      logger.info('Email would be sent via AWS SES', {
        to: options.to,
        subject: options.subject,
      });

      return {
        messageId: `ses-${Date.now()}`,
        status: 'sent',
      };
    } catch (error) {
      throw new ExternalServiceError(
        'AWS SES',
        'Failed to send email via SES',
        { error }
      );
    }
  }

  /**
   * SMTP email sender
   */
  private async sendWithSMTP(options: EmailOptions): Promise<EmailResult> {
    try {
      // This is a placeholder implementation
      // In a real application, you would use nodemailer or similar

      logger.info('Email would be sent via SMTP', {
        to: options.to,
        subject: options.subject,
      });

      return {
        messageId: `smtp-${Date.now()}`,
        status: 'sent',
      };
    } catch (error) {
      throw new ExternalServiceError('SMTP', 'Failed to send email via SMTP', {
        error,
      });
    }
  }

  /**
   * Get email template
   */
  private getTemplate(templateName: string): EmailTemplate {
    // This is a simplified template system
    // In production, you might use a more sophisticated template engine

    const templates: Record<string, EmailTemplate> = {
      [EMAIL_CONSTANTS.TEMPLATES.WELCOME]: {
        subject: 'Welcome to ConnectKit!',
        htmlContent: `
          <h1>Welcome {{firstName}}!</h1>
          <p>Thank you for joining {{appName}}. We're excited to have you on board!</p>
          <p>Start managing your contacts more effectively today.</p>
        `,
      },

      [EMAIL_CONSTANTS.TEMPLATES.EMAIL_VERIFICATION]: {
        subject: 'Verify your email address',
        htmlContent: `
          <h1>Verify your email</h1>
          <p>Hi {{firstName}},</p>
          <p>Please click the link below to verify your email address:</p>
          <p><a href="{{verificationUrl}}">Verify Email</a></p>
          <p>If you didn't create an account with {{appName}}, please ignore this email.</p>
        `,
      },

      [EMAIL_CONSTANTS.TEMPLATES.PASSWORD_RESET]: {
        subject: 'Reset your password',
        htmlContent: `
          <h1>Reset your password</h1>
          <p>Hi {{firstName}},</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="{{resetUrl}}">Reset Password</a></p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
      },

      [EMAIL_CONSTANTS.TEMPLATES.PASSWORD_CHANGED]: {
        subject: 'Your password has been changed',
        htmlContent: `
          <h1>Password changed</h1>
          <p>Hi {{firstName}},</p>
          <p>Your {{appName}} password has been successfully changed.</p>
          <p>If you didn't make this change, please contact support immediately.</p>
          <p><a href="{{supportUrl}}">Contact Support</a></p>
        `,
      },

      [EMAIL_CONSTANTS.TEMPLATES.ACCOUNT_LOCKED]: {
        subject: 'Your account has been temporarily locked',
        htmlContent: `
          <h1>Account temporarily locked</h1>
          <p>Hi {{firstName}},</p>
          <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
          <p>Your account will be unlocked at: {{lockedUntil}}</p>
          <p>If you need assistance, please contact support.</p>
          <p><a href="{{supportUrl}}">Contact Support</a></p>
        `,
      },

      [EMAIL_CONSTANTS.TEMPLATES.LOGIN_ALERT]: {
        subject: 'New login to your account',
        htmlContent: `
          <h1>New login detected</h1>
          <p>Hi {{firstName}},</p>
          <p>We detected a new login to your {{appName}} account:</p>
          <ul>
            <li>Time: {{loginTime}}</li>
            <li>IP Address: {{ipAddress}}</li>
            <li>Location: {{location}}</li>
            <li>Device: {{userAgent}}</li>
          </ul>
          <p>If this wasn't you, please secure your account immediately.</p>
        `,
      },
    };

    const template = templates[templateName];
    if (!template) {
      throw new ValidationError(`Email template not found: ${templateName}`);
    }

    return template;
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return rendered;
  }

  /**
   * Get email statistics
   */
  async getEmailStats(): Promise<EmailStats> {
    // This would typically fetch from your email provider's API
    // For now, return mock data

    return {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      failed: 0,
    };
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<{ success: boolean; message: string }> {
    try {
      const testResult = await this.sendEmail({
        to: { email: 'test@example.com', name: 'Test User' },
        subject: 'Email Configuration Test',
        text: 'This is a test email to verify email configuration.',
        tags: ['test'],
      });

      return {
        success: testResult.status === 'sent',
        message:
          testResult.status === 'sent'
            ? 'Email configuration is working correctly'
            : `Email test failed: ${testResult.error}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Email configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
