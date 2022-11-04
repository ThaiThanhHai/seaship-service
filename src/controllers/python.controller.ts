import { Controller, Post, Body } from '@nestjs/common';
import { PythonService } from 'src/services/python.service';
import { VrpDto } from './dto/vrp.dto';
import { Res } from '@nestjs/common/decorators/http/route-params.decorator';

@Controller('python')
export class PythonController {
  constructor(private readonly pythonService: PythonService) {}

  @Post('')
  getListOfDeliveryType(@Body() vrpDto: VrpDto, @Res() res) {
    return this.pythonService.getVehicleRouting(vrpDto, res);
  }
}
