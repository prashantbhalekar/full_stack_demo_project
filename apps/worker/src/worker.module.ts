import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { QueueConsumerService } from "./queue/queue-consumer.service";
import { MailService } from "./mail/mail.service";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [QueueConsumerService, MailService],
})
export class WorkerModule {}
