import csv

def get_trips_per_day():
    reader = csv.reader(open(r"201907-citibike-tripdata.csv"),delimiter=',')
    filtered = filter(lambda p: '2019-07-26' in p[1], reader)
    csv.writer(open(r"birthday_trips.csv", 'w'), delimiter=' ').writerows(filtered)

    trips = {}
    for trip in filtered:
        id = trip[3]
        if id not in trips:
            trips[id] = [trip]
        else:
            trips[id].append(trip)

    trips_file = open("birthday_trips.js", "w")
    trips_file.write('let global_trips = ' + str(trips))
    trips_file.close()

    # results = []
    # for row in filtered: # each row is a list
    #     results.append(row)

    # trips = open("birthday_trips.js", "w")
    # trips.write(str(results))
    # trips.close()


if __name__ == "__main__":
    get_trips_per_day()