import { Controller, Get } from '@nestjs/common';
import { DashboardService } from 'src/services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('statistic')
  getDataStatisticOrderStatus() {
    return this.dashboardService.getDataStatistic();
  }
}
