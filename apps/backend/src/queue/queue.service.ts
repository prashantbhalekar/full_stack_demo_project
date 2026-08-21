import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { ApprovalNotificationJob, MAIL_NOTIFICATION_QUEUE } from "@full-stack-demo/shared-types";

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queue: Queue<ApprovalNotificationJob>;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.getOrThrow<string>("REDIS_URL");
    this.queue = new Queue<ApprovalNotificationJob>(MAIL_NOTIFICATION_QUEUE, {
      connection: { url: redisUrl },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }

  async enqueueApprovalNotification(job: ApprovalNotificationJob) {
    await this.queue.add("organization-approval-notification", job, {
      jobId: `${job.approvalId}-${job.status}`,
    });
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}
