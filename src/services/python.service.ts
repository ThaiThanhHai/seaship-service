import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PythonShell, Options } from 'python-shell';

@Injectable()
export class PythonService {
  // startPythonInNodeJS(@Res() res) {
  //   const coordinates = [
  //     [10.045162, 105.746857],
  //     [10.762622, 106.660172],
  //     [10.086128, 106.016997],
  //     [9.812741, 106.299291],
  //   ];
  //   const num_vehicles = 4;
  //   const depot = 0;
  //   const weight = 100;
  //   const dimension = 50;
  //   const result = this.startPython(
  //     coordinates,
  //     num_vehicles,
  //     depot,
  //     weight,
  //     dimension,
  //     res,
  //   );

  //   return result;
  // }

  getVehicleRouting(coordinates, num_vehicles, depot, weight, dimension, res) {
    const options: Options = {
      mode: 'json',
      pythonPath:
        'C:/Users/Admin/AppData/Local/Programs/Python/Python39/python.exe',
      scriptPath: './src/scripts',
      pythonOptions: ['-u'],
      args: [
        JSON.stringify(coordinates),
        JSON.stringify(num_vehicles),
        JSON.stringify(depot),
        JSON.stringify(weight),
        JSON.stringify(dimension),
      ],
    };

    PythonShell.run('vrp.py', options, function (err, result) {
      if (err) throw new InternalServerErrorException(err);
      res.json(result);
    });
  }
}
