import { Injectable, Logger } from "@nestjs/common";
import { ApprovalNotificationJob } from "@full-stack-demo/shared-types";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendApprovalUpdate(job: ApprovalNotificationJob) {
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!smtpConfigured) {
      this.logger.log(`SMTP not configured, logging mail job delivery: ${JSON.stringify(job)}`);
      return;
    }

    this.logger.log(`SMTP configured. Placeholder send for ${job.email} with status ${job.status}`);
  }
}
