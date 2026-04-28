/**
 * Email Notification Service
 * 
 * Handles sending email notifications using Nodemailer
 * Supports SMTP configuration and email templates
 */

import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

class EmailNotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;
  private isInitialized = false;

  /**
   * Initialize email service with SMTP configuration
   */
  initialize(config: EmailConfig): void {
    try {
      this.config = config;
      this.transporter = nodemailer.createTransporter({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
      });
      
      this.isInitialized = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.transporter !== null;
  }

  /**
   * Send email notification
   */
  async sendEmail(message: EmailMessage): Promise<void> {
    if (!this.isReady()) {
      console.warn('Email service not initialized');
      return;
    }

    if (!this.transporter || !this.config) {
      throw new Error('Email transporter not initialized');
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: this.config.from,
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send email using template
   */
  async sendEmailWithTemplate(
    to: string | string[],
    template: EmailTemplate,
    templateData: Record<string, any> = {}
  ): Promise<void> {
    const processedSubject = this.processTemplate(template.subject, templateData);
    const processedHtml = this.processTemplate(template.html, templateData);
    const processedText = template.text ? this.processTemplate(template.text, templateData) : undefined;

    await this.sendEmail({
      to,
      subject: processedSubject,
      html: processedHtml,
      text: processedText,
    });
  }

  /**
   * Process template variables
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    let processed = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return processed;
  }

  /**
   * Get email templates for different notification types
   */
  getTemplate(type: string, data: Record<string, any> = {}): EmailTemplate {
    switch (type) {
      case 'race_starting':
        return {
          subject: 'Race Starting Soon - {{raceName}}',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Race Starting Soon</h2>
              <p>Hi {{userName}},</p>
              <p>Your race <strong>{{raceName}}</strong> is starting in <strong>{{timeUntil}}</strong>.</p>
              <p>Get ready and make sure you're at the starting line!</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Race Details:</h3>
                <p><strong>Date:</strong> {{raceDate}}</p>
                <p><strong>Track:</strong> {{trackName}}</p>
                <p><strong>Duration:</strong> {{raceDuration}}</p>
              </div>
              <p>Good luck!</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">
                This is an automated notification from Race Wars.
                You can manage your notification preferences in your account settings.
              </p>
            </div>
          `,
        };

      case 'race_started':
        return {
          subject: 'Race Started - {{raceName}}',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Race Started!</h2>
              <p>Hi {{userName}},</p>
              <p>Your race <strong>{{raceName}}</strong> has started!</p>
              <p>Track your progress and compete for the best time.</p>
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Live Race:</h3>
                <p><strong>Track:</strong> {{trackName}}</p>
                <p><strong>Started:</strong> {{startTime}}</p>
                <p><strong>Participants:</strong> {{participantCount}}</p>
              </div>
              <p>Race safe and have fun!</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">
                This is an automated notification from Race Wars.
                You can manage your notification preferences in your account settings.
              </p>
            </div>
          `,
        };

      case 'penalty':
        return {
          subject: 'Speed Violation Penalty - {{raceName}}',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Speed Violation Detected</h2>
              <p>Hi {{userName}},</p>
              <p>A speed violation has been recorded during your race <strong>{{raceName}}</strong>.</p>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Violation Details:</h3>
                <p><strong>Speed:</strong> {{actualSpeed}} km/h</p>
                <p><strong>Speed Limit:</strong> {{speedLimit}} km/h</p>
                <p><strong>Location:</strong> {{location}}</p>
                <p><strong>Time:</strong> {{violationTime}}</p>
                <p><strong>Penalty:</strong> {{penaltyType}}</p>
              </div>
              <p>Please respect the speed limits for your safety and the safety of others.</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">
                This is an automated notification from Race Wars.
                You can manage your notification preferences in your account settings.
              </p>
            </div>
          `,
        };

      case 'flag_change':
        return {
          subject: 'Flag Alert - {{flagType}} Flag - {{raceName}}',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f59e0b;">Flag Alert</h2>
              <p>Hi {{userName}},</p>
              <p>A <strong>{{flagType}}</strong> flag has been displayed during your race <strong>{{raceName}}</strong>.</p>
              <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Flag Information:</h3>
                <p><strong>Flag Type:</strong> {{flagType}}</p>
                <p><strong>Sector:</strong> {{sector}}</p>
                <p><strong>Reason:</strong> {{reason}}</p>
                <p><strong>Time:</strong> {{flagTime}}</p>
              </div>
              <p>Please follow the flag procedures and adjust your driving accordingly.</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">
                This is an automated notification from Race Wars.
                You can manage your notification preferences in your account settings.
              </p>
            </div>
          `,
        };

      default:
        return {
          subject: 'Race Wars Notification',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #374151;">Notification</h2>
              <p>Hi {{userName}},</p>
              <p>{{message}}</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">
                This is an automated notification from Race Wars.
                You can manage your notification preferences in your account settings.
              </p>
            </div>
          `,
        };
    }
  }

  /**
   * Send race notification email
   */
  async sendRaceNotification(
    to: string | string[],
    type: 'race_starting' | 'race_started' | 'race_finished',
    data: Record<string, any>
  ): Promise<void> {
    const template = this.getTemplate(type, data);
    await this.sendEmailWithTemplate(to, template, data);
  }

  /**
   * Send penalty notification email
   */
  async sendPenaltyNotification(
    to: string | string[],
    data: Record<string, any>
  ): Promise<void> {
    const template = this.getTemplate('penalty', data);
    await this.sendEmailWithTemplate(to, template, data);
  }

  /**
   * Send flag notification email
   */
  async sendFlagNotification(
    to: string | string[],
    data: Record<string, any>
  ): Promise<void> {
    const template = this.getTemplate('flag_change', data);
    await this.sendEmailWithTemplate(to, template, data);
  }

  /**
   * Send general notification email
   */
  async sendGeneralNotification(
    to: string | string[],
    subject: string,
    message: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    const template = {
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #374151;">${subject}</h2>
          <p>Hi ${data.userName || 'Driver'},</p>
          <p>${message}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated notification from Race Wars.
            You can manage your notification preferences in your account settings.
          </p>
        </div>
      `,
    };
    
    await this.sendEmailWithTemplate(to, template, data);
  }

  /**
   * Verify email configuration
   */
  async verifyConfiguration(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Email configuration verified successfully');
      return true;
    } catch (error) {
      console.error('Email configuration verification failed:', error);
      return false;
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    ready: boolean;
    config: EmailConfig | null;
  } {
    return {
      initialized: this.isInitialized,
      ready: this.isReady(),
      config: this.config,
    };
  }
}

export const emailNotificationService = new EmailNotificationService();
