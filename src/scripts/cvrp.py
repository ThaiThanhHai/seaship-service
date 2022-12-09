import sys
import json
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np
import math
import haversine

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)


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
    coordinates = json.loads(sys.argv[1])
    num_vehicles = json.loads(sys.argv[2])
    depot = json.loads(sys.argv[3])
    weight = json.loads(sys.argv[4])
    vehicle_weight = json.loads(sys.argv[5])
    dimension = json.loads(sys.argv[6])
    vehicle_dimension = json.loads(sys.argv[7])
    max_travel = json.loads(sys.argv[8])

    # coordinates = [[10.0301,105.7706],[10.0312,105.767],[10.0107,105.739],[9.9928,105.663],[10.0622,105.718]]
    # num_vehicles = 2
    # weight = [ 0,0.8,0.5,0.5,1.2]
    # vehicle_weight = [ 20, 20 ]
    # dimension = [ 0,16,1.02,1.02,0.5 ]
    # vehicle_dimension = [ 56, 56 ]
    # depot = 0
    # max_travel = 500

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
    weight_index = routing.RegisterUnaryTransitCallback(
        weight_callback)
    routing.AddDimensionWithVehicleCapacity(
        weight_index, 0, data['vehicle_weight'], True, 'Weight')
    # distance_dimension = routing.GetDimensionOrDie('Weight')
    # distance_dimension.SetGlobalSpanCostCoefficient(100)

    # Add Dimension constraint.
    def dimension_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return data['dimension'][from_node]
    dimension_index = routing.RegisterUnaryTransitCallback(
        dimension_callback)
    routing.AddDimensionWithVehicleCapacity(
        dimension_index, 0, data['vehicle_dimension'], True, 'Dimension')

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
        print(json.dumps(vehicle_routes, cls=NpEncoder))
    else:
        print(json.dumps("No solution found"))


if __name__ == '__main__':
    main()
