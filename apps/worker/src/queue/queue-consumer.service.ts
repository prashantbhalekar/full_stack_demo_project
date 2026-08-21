import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job, Worker } from "bullmq";
import { ApprovalNotificationJob, MAIL_NOTIFICATION_QUEUE } from "@full-stack-demo/shared-types";
import { MailService } from "../mail/mail.service";

@Injectable()
export class QueueConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueConsumerService.name);
  private worker?: Worker<ApprovalNotificationJob>;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  onModuleInit() {
    const redisUrl = this.configService.getOrThrow<string>("REDIS_URL");

    this.worker = new Worker<ApprovalNotificationJob>(
      MAIL_NOTIFICATION_QUEUE,
      async (job: Job<ApprovalNotificationJob>) => {
        await this.mailService.sendApprovalUpdate(job.data);
      },
      {
        connection: { url: redisUrl },
      },
    );

    this.worker.on("completed", (job) => {
      this.logger.log(`Processed job ${job.id}`);
    });

    this.worker.on("failed", (job, err) => {
      this.logger.error(`Job ${job?.id ?? "unknown"} failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
