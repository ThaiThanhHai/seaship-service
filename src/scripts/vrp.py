import sys
import json
from haversine import haversine
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp


def calculate_distance_matrix(locations):
    distance_matrix = []
    for i in locations:
        distances = []
        for j in locations:
            distances.append(haversine(i, j))
        distance_matrix.append(distances)
    return distance_matrix


def create_data_model(distance_matrix, num_vehicles, depot):
    data = {}
    data['distance_matrix'] = distance_matrix
    data['num_vehicles'] = num_vehicles
    data['depot'] = depot
    return data


def print_solution(data, manager, routing, solution):
    vehicle_routes = []
    for vehicle_id in range(data['num_vehicles']):
        index = routing.Start(vehicle_id)
        route_distance = 0
        routes = []
        while not routing.IsEnd(index):
            route = format(manager.IndexToNode(index))
            routes.append(int(route))
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            route_distance += routing.GetArcCostForVehicle(
                previous_index, index, vehicle_id)
        depot = format(manager.IndexToNode(index))
        routes.append(int(depot))
        vehicle_route = {
            "route": routes,
            "route_distance": route_distance
        }

        vehicle_routes.append(vehicle_route)
    return vehicle_routes


def main():
    coordinates = json.loads(sys.argv[1])
    num_vehicles = json.loads(sys.argv[2])
    depot = json.loads(sys.argv[3])
    weight = json.loads(sys.argv[4])
    dimension = json.loads(sys.argv[5])

    # coordinates = [
    #     [10.045162, 105.746857],
    #     [10.762622, 106.660172],
    #     [10.086128, 106.016997],
    #     [9.812741, 106.299291],
    # ]
    # num_vehicles = 4
    # depot = 0
    # weight = 100
    # dimension = 50

    distance_matrix = calculate_distance_matrix(coordinates)

    data = create_data_model(distance_matrix, num_vehicles, depot)

    # Create the routing index manager.
    manager = pywrapcp.RoutingIndexManager(len(data['distance_matrix']),
                                           data['num_vehicles'], data['depot'])

    # Create Routing Model.
    routing = pywrapcp.RoutingModel(manager)

    # Create and register a transit callback.

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data['distance_matrix'][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)

    # Define cost of each arc.
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Add Distance constraint.
    dimension_name = 'Distance'
    routing.AddDimension(
        transit_callback_index,
        0,  # no slack
        3000,  # vehicle maximum travel distance
        True,  # start cumul to zero
        dimension_name)
    distance_dimension = routing.GetDimensionOrDie(dimension_name)
    distance_dimension.SetGlobalSpanCostCoefficient(100)

    # Setting first solution heuristic.
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)

    # Solve the problem.
    solution = routing.SolveWithParameters(search_parameters)

    # Print solution on console.
    if solution:
        vehicle_routes = print_solution(data, manager, routing, solution)
        print(json.dumps(vehicle_routes))
    else:
        print(json.dumps("No solution found"))


if __name__ == '__main__':
    main()
