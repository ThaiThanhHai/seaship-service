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


def create_data_model(distance_matrix, num_vehicles, dimension, vehicle_dimension, depot, max_travel):
    data = {}
    data['distance_matrix'] = distance_matrix
    data['num_vehicles'] = num_vehicles
    data['vehicle_dimension'] = vehicle_dimension
    data['dimension'] = dimension
    data['depot'] = depot
    data['max_travel'] = max_travel
    return data


def print_solution(data, manager, routing, solution):
    result = []
    for vehicle_id in range(data['num_vehicles']):
        index = routing.Start(vehicle_id)
        route_distance = []
        route_dimension = []
        routes = []
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            route = format(manager.IndexToNode(index))
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
            "total_distance": round(np.sum(route_distance), 2),
            "dimensions": route_dimension,
            "total_dimension": round(np.sum(route_dimension), 2),
        })

    return result


def main():
    coordinates = json.loads(sys.argv[1])
    num_vehicles = json.loads(sys.argv[2])
    depot = json.loads(sys.argv[3])
    dimension = json.loads(sys.argv[4])
    vehicle_dimension = json.loads(sys.argv[5])
    max_travel = json.loads(sys.argv[6])

    # coordinates = [[10.0301, 105.7706], [10.0633, 105.761], [10.063, 105.764], [10.0622, 105.718], [10.0475, 105.787], [10.0659, 105.682], [10.0351, 105.691], [
    #     10.0107, 105.739], [10.0663, 105.559], [9.97949, 105.71], [10.1082, 105.62], [9.99753, 105.667], [10.0297, 105.796], [10.0297, 105.796], [10.0297, 105.796]]
    # num_vehicles = 3
    # depot = 0
    # dimension = [0, 0.13, 0.73, 2.5, 0.21, 0.13,
    #              2.92, 0.2, 3.25, 1, 0.13, 0.04, 12, 30, 3]
    # vehicle_dimension = [40, 40, 40]
    # max_travel = 500

    distance_matrix = calculate_distance_matrix(coordinates)

    data = create_data_model(
        distance_matrix, num_vehicles, dimension, vehicle_dimension, depot, max_travel)

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
