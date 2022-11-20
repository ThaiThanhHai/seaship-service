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
            distances.append(haversine(i, j) * 1000)
        distance_matrix.append(distances)
    return distance_matrix


def create_data_model(distance_matrix, num_vehicles, weight, vehicle_capacities, dimension, vehicle_dimensions, depot):
    data = {}
    data['distance_matrix'] = distance_matrix
    data['num_vehicles'] = num_vehicles
    data['vehicle_capacities'] = vehicle_capacities
    data['weight'] = weight
    data['dimension'] = dimension
    data['vehicle_dimensions'] = vehicle_dimensions
    data['depot'] = depot

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
            route_dimension.append(
                data['dimension'][node_index])
            previous_index = index
            routes.append(int(route))
            index = solution.Value(routing.NextVar(index))
            route_distance.append(routing.GetArcCostForVehicle(
                previous_index, index, vehicle_id))
        routes.append(int(format(manager.IndexToNode(index))))

        result.append({
            "route": routes,
            "distances": route_distance,
            "weights": route_weight,
            "dimensions": route_dimension
        })

    return result


def main():
    coordinates = json.loads(sys.argv[1])
    num_vehicles = json.loads(sys.argv[2])
    depot = json.loads(sys.argv[3])
    weight = json.loads(sys.argv[4])
    vehicle_capacities = json.loads(sys.argv[5])
    dimension = json.loads(sys.argv[6])
    vehicle_dimensions = json.loads(sys.argv[7])
    max_travel = json.loads(sys.argv[8])

    # coordinates = [
    #     [10.030113295509345, 105.77061529689202],
    #     [10.250198217684128, 105.96187416990598],
    #     [9.923673527563325, 106.3465943987395],
    #     [10.37181409556936, 105.43234962572943],
    #     [9.916572863829149, 105.14421442387881],
    #     [10.41995563449439, 105.64378551038794],
    #     [9.291760218862118, 105.7126964680528]
    # ]
    # vehicle_capacities = [3, 3, 20, 8]
    # vehicle_dimensions = [30, 50, 50, 200]
    # weight = [0, 1.2, 3.5, 6, 4, 1, 7]
    # dimension = [0, 20, 40, 100, 40, 10, 10]
    # num_vehicles = 4
    # depot = 0

    distance_matrix = calculate_distance_matrix(coordinates)

    data = create_data_model(
        distance_matrix, num_vehicles, weight, vehicle_capacities, dimension, vehicle_dimensions, depot)

    # Create the routing index manager.
    manager = pywrapcp.RoutingIndexManager(len(data['distance_matrix']),
                                           data['num_vehicles'], data['depot'])

    # Create Routing Model.
    routing = pywrapcp.RoutingModel(manager)

    # Create and register a transit callback.
    def distance_callback(from_index, to_index):
        """Returns the distance between the two nodes."""
        # Convert from routing variable Index to distance matrix NodeIndex.
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data['distance_matrix'][from_node][to_node]
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Add Distance constraint.
    dimension_name = 'Distance'
    routing.AddDimension(
        transit_callback_index,
        0,  # no slack
        max_travel,  # vehicle maximum travel distance
        True,  # start cumul to zero
        'Distance')
    distance_dimension = routing.GetDimensionOrDie(dimension_name)
    distance_dimension.SetGlobalSpanCostCoefficient(100)

    # Add Capacity constraint.
    def capacity_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return data['weight'][from_node]
    capacity_callback_index = routing.RegisterUnaryTransitCallback(
        capacity_callback)
    routing.AddDimensionWithVehicleCapacity(
        capacity_callback_index,
        0,  # null capacity slack
        data['vehicle_capacities'],  # vehicle maximum capacities
        True,  # start cumul to zero
        'Capacity')

    # Add Dimension constraint.
    def dimension_callback(from_index):
        """Returns the demand of the node."""
        # Convert from routing variable Index to demands NodeIndex.
        from_node = manager.IndexToNode(from_index)
        return data['dimension'][from_node]

    dimension_callback_index = routing.RegisterUnaryTransitCallback(
        dimension_callback)
    routing.AddDimensionWithVehicleCapacity(
        dimension_callback_index,
        0,  # null capacity slack
        data['vehicle_dimensions'],  # vehicle maximum capacities
        True,  # start cumul to zero
        'dimension')

    # Setting first solution heuristic.
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
    search_parameters.time_limit.FromSeconds(1)

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
