import { Controller, Post, Body } from '@nestjs/common';
import { ScheduleService } from 'src/services/schedule.service';
import { ScheduleDto } from './dto/schedule.dto';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post('')
  public deliverySchedule(@Body() scheduleDto: ScheduleDto) {
    return this.scheduleService.deliverySchedule(scheduleDto);
  }
}
