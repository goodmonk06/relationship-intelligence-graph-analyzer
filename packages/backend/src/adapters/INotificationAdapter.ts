/**
 * Notification adapter interface
 * Implement this to send notifications via email, Slack, webhooks, etc.
 */

export interface NotificationMessage {
  title: string;
  body: string;
  recipient?: string;
  metadata?: Record<string, any>;
}

export interface INotificationAdapter {
  /**
   * Send a notification
   */
  send(message: NotificationMessage): Promise<void>;

  /**
   * Check if the adapter is properly configured
   */
  isConfigured(): boolean;
}

/**
 * Console notification adapter (for development)
 */
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async send(message: NotificationMessage): Promise<void> {
    console.log('📧 Notification:', {
      title: message.title,
      body: message.body,
      recipient: message.recipient,
    });
  }

  isConfigured(): boolean {
    return true;
  }
}

/**
 * Webhook notification adapter
 */
export class WebhookNotificationAdapter implements INotificationAdapter {
  constructor(private webhookUrl: string) {}

  async send(message: NotificationMessage): Promise<void> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }
  }

  isConfigured(): boolean {
    return !!this.webhookUrl;
  }
}
