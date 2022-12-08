import sys
import json
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np
import math


def haversine(lat1, lon1, lat2, lon2):
    dLat = (lat2 - lat1) * math.pi / 180.0
    dLon = (lon2 - lon1) * math.pi / 180.0
    lat1 = (lat1) * math.pi / 180.0
    lat2 = (lat2) * math.pi / 180.0
    a = (pow(math.sin(dLat / 2), 2) +
         pow(math.sin(dLon / 2), 2) *
         math.cos(lat1) * math.cos(lat2))
    rad = 6371
    c = 2 * math.asin(math.sqrt(a))
    return rad * c


def calculate_distance_matrix(coordinates):
    distance_matrix = []
    for from_node in coordinates:
        distances = []
        for to_node in coordinates:
            distances.append(
                round(haversine(from_node[0], from_node[1], to_node[0], to_node[1]), 2))
        distance_matrix.append(distances)
    return distance_matrix


def create_data_model(distance_matrix, num_vehicles, weight, vehicle_weight, dimension, vehicle_dimension, depot, max_travel):
    data = {}
    data['distance_matrix'] = distance_matrix
    data['num_vehicles'] = num_vehicles
    data['vehicle_weight'] = vehicle_weight
    data['vehicle_dimension'] = vehicle_dimension
    data['weight'] = weight
    data['dimension'] = dimension
    data['depot'] = depot
    data['max_travel'] = max_travel
    return data


def print_solution(data, manager, routing, solution):
    result = []
    for vehicle_id in range(data['num_vehicles']):
        index = routing.Start(vehicle_id)
        route_distance = []
        route_weight = []
        route_dimension = []
        routes = []
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            route = format(manager.IndexToNode(index))
            route_weight.append(data['weight'][node_index])
            route_dimension.append(data['dimension'][node_index])
            previous_index = index
            routes.append(int(route))
            index = solution.Value(routing.NextVar(index))
            route_distance.append(routing.GetArcCostForVehicle(
                previous_index, index, vehicle_id))
        routes.append(int(format(manager.IndexToNode(index))))

        result.append({
            "route": routes,
            "distances": route_distance,
            "total_distance": np.sum(route_distance),
            "weights": route_weight,
            "total_weight": np.sum(route_weight),
            "dimensions": route_dimension,
            "total_dimension": np.sum(route_dimension),
        })

    return result


def main():
    # coordinates = json.loads(sys.argv[1])
    # num_vehicles = json.loads(sys.argv[2])
    # depot = json.loads(sys.argv[3])
    # weight = json.loads(sys.argv[4])
    # vehicle_weight = json.loads(sys.argv[5])
    # dimension = json.loads(sys.argv[6])
    # vehicle_dimension = json.loads(sys.argv[7])
    # max_travel = json.loads(sys.argv[8])

    # -0. Cần Thơ 10.03059983729994, 105.7707636173672
    # -1. Vĩnh Long  10.235670148568532, 105.96896163739984
    # -2. Long An 10.606770428612812, 106.404010120079
    # -3. Tiền Giang 10.366423168311577, 106.0427062978259
    # -4. Đồng Tháp 10.451089854485828, 105.63255705150969
    # -5. An Giang 10.382375162556539, 105.39137281666905
    # -6. Kiên Giang 10.014473941214565, 105.08068469821401
    # -7. Cà Mau 9.196707170879417, 105.16244901996315
    # -8. Bạc Liệu 9.288540632592401, 105.72394672138354
    # -9. Sóc Trăng 9.601410285482292, 105.94502363289503
    # -10. Bến Tre 10.245331400929652, 106.34430818627477
    # -11. Trà Vinh 9.940288798870643, 106.34348186585552
    # -12. Hậu Giang 9.71122745324128, 105.53514926478884

    coordinates = [
        [10.031068128021307, 105.77046997694818],
        [10.235670148568532, 105.96896163739984],
        [10.606770428612812, 106.404010120079],
        [10.366423168311577, 106.0427062978259],
        [10.451089854485828, 105.63255705150969],
        [10.382375162556539, 105.39137281666905],
        [10.014473941214565, 105.08068469821401],
        [9.196707170879417, 105.16244901996315],
        [9.288540632592401, 105.72394672138354],
        [9.601410285482292, 105.94502363289503],
        [10.245331400929652, 106.34430818627477],
        [9.940288798870643, 106.34348186585552],
        [9.71122745324128, 105.53514926478884],
    ]

    vehicle_weight = [1000, 1000, 1000, 500]
    vehicle_dimension = [8.16, 8.16, 8.16, 3.12]
    weight = [0, 200, 140, 100, 100, 100, 70,
              100, 100, 100, 100, 0.025, 0.09]
    dimension = [0, 0.016, 0.054, 0.01, 0.03, 0.09,
                 0.087, 0.15, 0.3, 0.045, 0.12, 0.15, 0.35]
    num_vehicles = 4
    depot = 0
    max_travel = 500

    distance_matrix = calculate_distance_matrix(coordinates)

    data = create_data_model(distance_matrix, num_vehicles, weight,
                             vehicle_weight, dimension, vehicle_dimension, depot, max_travel)

    # Create the routing model.
    len_distance_matrix = len(data['distance_matrix'])
    manager = pywrapcp.RoutingIndexManager(
        len_distance_matrix, data['num_vehicles'], data['depot'])
    routing = pywrapcp.RoutingModel(manager)

    # Define the distance callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data['distance_matrix'][from_node][to_node]
    transit_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_index)
    routing.AddDimension(transit_index, 0,
                         max_travel, True, 'Distance')
    distance_dimension = routing.GetDimensionOrDie('Distance')
    distance_dimension.SetGlobalSpanCostCoefficient(100)

    # Add Weight constraint.
    def weight_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return data['weight'][from_node]
    weight_callback_index = routing.RegisterUnaryTransitCallback(
        weight_callback)
    routing.AddDimensionWithVehicleCapacity(
        weight_callback_index, 0, data['vehicle_weight'], True, 'Weight')

    # Add Dimension constraint.
    def dimension_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return data['dimension'][from_node]
    dimension_callback_index = routing.RegisterUnaryTransitCallback(
        dimension_callback)
    routing.AddDimensionWithVehicleCapacity(
        dimension_callback_index, 0, data['vehicle_dimension'], True, 'Dimension')

    # Setting first solution heuristic.
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.time_limit.FromSeconds(2)
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)

    # Solve the problem.
    solution = routing.SolveWithParameters(search_parameters)

    # Print solution on console.
    if solution:
        vehicle_routes = print_solution(data, manager, routing, solution)
        print(json.dumps(vehicle_routes))
        # print(vehicle_routes)
    else:
        print(json.dumps("No solution found"))


if __name__ == '__main__':
    main()
