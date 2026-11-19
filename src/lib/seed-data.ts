/**
 * Seed dataset for V/LINE CONTROL.
 *
 * Station coordinates are approximate geographic positions of the real
 * Victorian stop locations, suitable for orientation on a schematic network
 * map. They are NOT survey data and must not be used for navigation.
 *
 * This file contains reference data only (corridors, station names and station
 * positions). No disruptions, service statuses or live train positions are
 * stored here — those are entered by operators through the console.
 */

export interface SeedStation {
  name: string;
  lat: number;
  lng: number;
  suburb?: string;
  platforms?: string | null;
  facilities?: string | null;
  connections?: string | null;
}

export interface SeedLine {
  slug: string;
  name: string;
  code: string;
  colour: string;
  region: string;
  description: string;
  origin: string;
  destination: string;
  servicePattern: string;
  status: string;
  stations: SeedStation[];
}

const SCC: SeedStation = {
  name: "Southern Cross",
  lat: -37.8183,
  lng: 144.9525,
  suburb: "Melbourne",
  platforms: "Regional platforms 1–8",
  facilities:
    "Staffed 24 hours · Ticket office · Waiting room · Toilets · Luggage storage · Food and retail",
  connections: "Metro Trains · Yarra Trams (Spencer Street) · SkyBus · Taxi rank",
};

const FOOTSCRAY: SeedStation = {
  name: "Footscray",
  lat: -37.7993,
  lng: 144.8997,
  suburb: "Footscray",
  facilities: "Staffed · Toilets · Parking",
  connections: "Metro Trains · Local buses",
};

const SUNSHINE: SeedStation = {
  name: "Sunshine",
  lat: -37.7881,
  lng: 144.8327,
  suburb: "Sunshine",
  facilities: "Staffed · Toilets · Parking",
  connections: "Metro Trains · Local buses",
};

const DEER_PARK: SeedStation = {
  name: "Deer Park",
  lat: -37.7672,
  lng: 144.7728,
  suburb: "Deer Park",
  facilities: "Staffed · Parking",
  connections: "Local buses",
};

const GEELONG: SeedStation = {
  name: "Geelong",
  lat: -38.1467,
  lng: 144.3547,
  suburb: "Geelong",
  facilities: "Staffed · Ticket office · Waiting room · Toilets · Parking",
  connections: "Local buses · Taxi rank",
};

const BALLARAT: SeedStation = {
  name: "Ballarat",
  lat: -37.5586,
  lng: 143.8583,
  suburb: "Ballarat Central",
  facilities: "Staffed · Ticket office · Waiting room · Toilets · Parking",
  connections: "Local buses · Taxi rank",
};

const BENDIGO: SeedStation = {
  name: "Bendigo",
  lat: -36.7661,
  lng: 144.2833,
  suburb: "Bendigo",
  facilities: "Staffed · Ticket office · Waiting room · Toilets · Parking",
  connections: "Local buses · Taxi rank",
};

const SEYMOUR: SeedStation = {
  name: "Seymour",
  lat: -37.0269,
  lng: 145.1383,
  suburb: "Seymour",
  facilities: "Staffed · Waiting room · Toilets · Parking",
  connections: "Local buses · Coach connections",
};

const TRARALGON: SeedStation = {
  name: "Traralgon",
  lat: -38.2,
  lng: 146.5333,
  suburb: "Traralgon",
  facilities: "Staffed · Ticket office · Waiting room · Toilets · Parking",
  connections: "Local buses · Taxi rank",
};

const WARRNAMBOOL: SeedStation = {
  name: "Warrnambool",
  lat: -38.3833,
  lng: 142.4833,
  suburb: "Warrnambool",
  facilities: "Staffed · Waiting room · Toilets · Parking",
  connections: "Local buses · Coach connections",
};

const SHEPPARTON: SeedStation = {
  name: "Shepparton",
  lat: -36.3833,
  lng: 145.4,
  suburb: "Shepparton",
  facilities: "Staffed · Waiting room · Toilets · Parking",
  connections: "Local buses · Coach connections",
};

const ALBURY: SeedStation = {
  name: "Albury",
  lat: -36.0667,
  lng: 146.9167,
  suburb: "Albury NSW",
  facilities: "Staffed · Waiting room · Toilets · Parking",
  connections: "NSW TrainLink · Local buses",
};

const s = (name: string, lat: number, lng: number, extra: Partial<SeedStation> = {}): SeedStation => ({
  name,
  lat,
  lng,
  ...extra,
});

export const SEED_LINES: SeedLine[] = [
  {
    slug: "geelong",
    name: "Geelong Line",
    code: "GEL",
    colour: "#a878f7",
    region: "Barwon",
    description:
      "Victoria's busiest regional corridor, running south-west from Melbourne through Wyndham and the Bellarine fringe into Geelong and Waurn Ponds.",
    origin: "Southern Cross",
    destination: "Waurn Ponds",
    servicePattern: "Frequent weekday services with limited weekday peak express patterns and weekend services approximately every 20–40 minutes.",
    status: "minor_delay",
    stations: [
      SCC,
      FOOTSCRAY,
      SUNSHINE,
      DEER_PARK,
      s("Tarneit", -37.8156, 144.69, { suburb: "Tarneit", connections: "Local buses" }),
      s("Wyndham Vale", -37.8386, 144.6183, { suburb: "Wyndham Vale", facilities: "Parking · Waiting room" }),
      s("Little River", -37.9736, 144.5069, { suburb: "Little River" }),
      s("Lara", -38.0244, 144.4058, { suburb: "Lara", facilities: "Parking" }),
      s("Corio", -38.0747, 144.3775, { suburb: "Corio" }),
      s("North Shore", -38.0917, 144.3653, { suburb: "North Shore" }),
      s("North Geelong", -38.1181, 144.3536, { suburb: "North Geelong", facilities: "Parking" }),
      GEELONG,
      s("South Geelong", -38.1589, 144.3569, { suburb: "South Geelong", facilities: "Parking" }),
      s("Marshall", -38.1783, 144.3611, { suburb: "Marshall", facilities: "Parking" }),
      s("Waurn Ponds", -38.2167, 144.3056, { suburb: "Waurn Ponds", facilities: "Parking · Waiting room" }),
    ],
  },
  {
    slug: "warrnambool",
    name: "Warrnambool Line",
    code: "WBL",
    colour: "#38bdf8",
    region: "Barwon South West",
    description:
      "The south-west corridor beyond Geelong, crossing the volcanic plains through Colac, Camperdown and Terang to the coast at Warrnambool.",
    origin: "Southern Cross",
    destination: "Warrnambool",
    servicePattern: "Limited daily services with coach connections beyond Warrnambool. Check the timetable before travelling.",
    status: "operational",
    stations: [
      SCC,
      FOOTSCRAY,
      SUNSHINE,
      DEER_PARK,
      s("Tarneit", -37.8156, 144.69),
      s("Wyndham Vale", -37.8386, 144.6183),
      s("Little River", -37.9736, 144.5069),
      s("Lara", -38.0244, 144.4058),
      s("Corio", -38.0747, 144.3775),
      s("North Shore", -38.0917, 144.3653),
      s("North Geelong", -38.1181, 144.3536),
      GEELONG,
      s("South Geelong", -38.1589, 144.3569),
      s("Marshall", -38.1783, 144.3611),
      s("Waurn Ponds", -38.2167, 144.3056),
      s("Winchelsea", -38.2431, 143.9833, { suburb: "Winchelsea" }),
      s("Birregurra", -38.3333, 143.7833, { suburb: "Birregurra" }),
      s("Colac", -38.3403, 143.5847, { suburb: "Colac", facilities: "Staffed · Waiting room · Toilets · Parking" }),
      s("Camperdown", -38.2333, 143.15, { suburb: "Camperdown", facilities: "Waiting room · Parking" }),
      s("Terang", -38.2333, 142.9167, { suburb: "Terang", facilities: "Waiting room · Parking" }),
      WARRNAMBOOL,
    ],
  },
  {
    slug: "ballarat",
    name: "Ballarat Line",
    code: "BAL",
    colour: "#fbbf24",
    region: "Grampians",
    description:
      "The western trunk through Melton, Bacchus Marsh and Ballan to Ballarat and Wendouree, serving one of Victoria's fastest-growing commuter belts.",
    origin: "Southern Cross",
    destination: "Wendouree",
    servicePattern: "Frequent services including dedicated peak express patterns from Melton and Bacchus Marsh.",
    status: "operational",
    stations: [
      SCC,
      FOOTSCRAY,
      SUNSHINE,
      s("Ardeer", -37.7833, 144.8, { suburb: "Ardeer" }),
      DEER_PARK,
      s("Caroline Springs", -37.7394, 144.7358, { suburb: "Caroline Springs", facilities: "Parking · Waiting room" }),
      s("Rockbank", -37.7319, 144.6644, { suburb: "Rockbank", facilities: "Parking" }),
      s("Cobblebank", -37.7144, 144.6289, { suburb: "Cobblebank", facilities: "Parking" }),
      s("Melton", -37.6833, 144.5833, { suburb: "Melton", facilities: "Staffed · Parking · Waiting room" }),
      s("Bacchus Marsh", -37.6756, 144.4369, { suburb: "Bacchus Marsh", facilities: "Staffed · Parking · Waiting room" }),
      s("Ballan", -37.6, 144.2333, { suburb: "Ballan", facilities: "Parking" }),
      BALLARAT,
      s("Wendouree", -37.5372, 143.8269, { suburb: "Wendouree", facilities: "Parking · Waiting room" }),
    ],
  },
  {
    slug: "ararat",
    name: "Ararat Line",
    code: "ARA",
    colour: "#fb923c",
    region: "Grampians",
    description:
      "Extends the Ballarat corridor west across the plains to Beaufort and the regional centre of Ararat.",
    origin: "Southern Cross",
    destination: "Ararat",
    servicePattern: "Several services each day, with coach connections onward to Hamilton, Horsham and Adelaide.",
    status: "operational",
    stations: [
      SCC,
      FOOTSCRAY,
      SUNSHINE,
      DEER_PARK,
      s("Caroline Springs", -37.7394, 144.7358),
      s("Melton", -37.6833, 144.5833),
      s("Bacchus Marsh", -37.6756, 144.4369),
      s("Ballan", -37.6, 144.2333),
      BALLARAT,
      s("Wendouree", -37.5372, 143.8269),
      s("Beaufort", -37.4333, 143.3833, { suburb: "Beaufort", facilities: "Parking" }),
      s("Ararat", -37.2833, 142.9333, {
        suburb: "Ararat",
        facilities: "Staffed · Waiting room · Toilets · Parking",
        connections: "Coach connections to Horsham and Hamilton",
      }),
    ],
  },
  {
    slug: "maryborough",
    name: "Maryborough Line",
    code: "MBY",
    colour: "#facc15",
    region: "Goldfields",
    description:
      "A goldfields branch from Ballarat through Creswick and Clunes to the heritage town of Maryborough.",
    origin: "Ballarat",
    destination: "Maryborough",
    servicePattern: "Limited daily services connecting with Ballarat line trains. Coach replacement is common during works.",
    status: "operational",
    stations: [
      BALLARAT,
      s("Creswick", -37.4247, 143.8917, { suburb: "Creswick", facilities: "Parking" }),
      s("Clunes", -37.2944, 143.7861, { suburb: "Clunes" }),
      s("Maryborough", -37.05, 143.7333, {
        suburb: "Maryborough",
        facilities: "Staffed · Waiting room · Parking",
        connections: "Coach connections to Castlemaine and Ballarat",
      }),
    ],
  },
  {
    slug: "bendigo",
    name: "Bendigo Line",
    code: "BGO",
    colour: "#34d399",
    region: "Loddon Campaspe",
    description:
      "Runs north-west via Sunbury, the Macedon Ranges and Castlemaine to Bendigo, Eaglehawk and Epsom.",
    origin: "Southern Cross",
    destination: "Epsom",
    servicePattern: "Frequent services with peak express patterns and a two-hourly base frequency outside peaks.",
    status: "operational",
    stations: [
      SCC,
      FOOTSCRAY,
      SUNSHINE,
      s("Watergardens", -37.6997, 144.7767, { suburb: "Taylors Lakes", facilities: "Parking", connections: "Metro Trains · Local buses" }),
      s("Sunbury", -37.5794, 144.7272, { suburb: "Sunbury", facilities: "Staffed · Parking", connections: "Metro Trains · Local buses" }),
      s("Clarkefield", -37.5167, 144.7333, { suburb: "Clarkefield", facilities: "Parking" }),
      s("Riddells Creek", -37.4667, 144.6833, { suburb: "Riddells Creek", facilities: "Parking" }),
      s("Gisborne", -37.4883, 144.5889, { suburb: "Gisborne", facilities: "Parking" }),
      s("Macedon", -37.4211, 144.5594, { suburb: "Macedon" }),
      s("Woodend", -37.3547, 144.5303, { suburb: "Woodend", facilities: "Parking · Waiting room" }),
      s("Kyneton", -37.2444, 144.4531, { suburb: "Kyneton", facilities: "Staffed · Parking" }),
      s("Malmsbury", -37.1833, 144.4167, { suburb: "Malmsbury" }),
      s("Castlemaine", -37.0667, 144.2167, {
        suburb: "Castlemaine",
        facilities: "Staffed · Waiting room · Toilets · Parking",
        connections: "Coach connections to Maryborough",
      }),
      s("Kangaroo Flat", -36.7956, 144.2472, { suburb: "Kangaroo Flat", facilities: "Parking" }),
      BENDIGO,
      s("Eaglehawk", -36.7167, 144.25, { suburb: "Eaglehawk", facilities: "Parking" }),
      s("Epsom", -36.7, 144.3, { suburb: "Epsom", facilities: "Parking" }),
    ],
  },
  {
    slug: "swan-hill",
    name: "Swan Hill Line",
    code: "SHL",
    colour: "#4ade80",
    region: "Mallee",
    description:
      "Follows the Loddon Valley north from Bendigo through Pyramid Hill and Kerang to the Murray at Swan Hill.",
    origin: "Bendigo",
    destination: "Swan Hill",
    servicePattern: "One return service on most days, with coach connections to Mildura and Robinvale.",
    status: "operational",
    stations: [
      BENDIGO,
      s("Eaglehawk", -36.7167, 144.25),
      s("Dingee", -36.4167, 144.2833, { suburb: "Dingee" }),
      s("Pyramid Hill", -36.0536, 144.2276, { suburb: "Pyramid Hill", facilities: "Parking" }),
      s("Kerang", -35.7333, 143.9167, {
        suburb: "Kerang",
        facilities: "Staffed · Waiting room · Parking",
        connections: "Coach connections to Koondrook and Barham",
      }),
      s("Swan Hill", -35.3375, 143.5542, {
        suburb: "Swan Hill",
        facilities: "Staffed · Waiting room · Toilets · Parking",
        connections: "Coach connections to Mildura and Robinvale",
      }),
    ],
  },
  {
    slug: "echuca",
    name: "Echuca Line",
    code: "ECH",
    colour: "#2dd4bf",
    region: "Loddon Campaspe",
    description:
      "A northern branch from Bendigo through Huntly, Goornong, Elmore and Rochester to the Murray at Echuca.",
    origin: "Bendigo",
    destination: "Echuca",
    servicePattern: "Daily services with coach connections to Moama and Deniliquin.",
    status: "operational",
    stations: [
      BENDIGO,
      s("Epsom", -36.7, 144.3),
      s("Huntly", -36.65, 144.3333, { suburb: "Huntly" }),
      s("Goornong", -36.5167, 144.5333, { suburb: "Goornong" }),
      s("Elmore", -36.4833, 144.6, { suburb: "Elmore", facilities: "Parking" }),
      s("Rochester", -36.3667, 144.7, { suburb: "Rochester", facilities: "Waiting room · Parking" }),
      s("Echuca", -36.1333, 144.75, {
        suburb: "Echuca",
        facilities: "Staffed · Waiting room · Toilets · Parking",
        connections: "Coach connections to Moama and Deniliquin",
      }),
    ],
  },
  {
    slug: "seymour",
    name: "Seymour Line",
    code: "SEY",
    colour: "#60a5fa",
    region: "Hume",
    description:
      "The north-east trunk through Broadmeadows, Wallan, Kilmore East and Broadford to Seymour.",
    origin: "Southern Cross",
    destination: "Seymour",
    servicePattern: "Frequent services throughout the day, with additional peak expresses.",
    status: "operational",
    stations: [
      SCC,
      s("Broadmeadows", -37.6833, 144.9167, { suburb: "Broadmeadows", connections: "Metro Trains · Local buses" }),
      s("Donnybrook", -37.5361, 144.97, { suburb: "Donnybrook", facilities: "Parking" }),
      s("Wallan", -37.4167, 144.9833, { suburb: "Wallan", facilities: "Parking" }),
      s("Kilmore East", -37.3, 144.95, { suburb: "Kilmore East", facilities: "Parking" }),
      s("Broadford", -37.2, 145.05, { suburb: "Broadford", facilities: "Parking" }),
      s("Tallarook", -37.1333, 145.0833, { suburb: "Tallarook" }),
      SEYMOUR,
    ],
  },
  {
    slug: "shepparton",
    name: "Shepparton Line",
    code: "SHP",
    colour: "#818cf8",
    region: "Goulburn",
    description:
      "Continues beyond Seymour through the Goulburn Valley via Nagambie and Murchison East to Shepparton.",
    origin: "Southern Cross",
    destination: "Shepparton",
    servicePattern: "Several services each day, with coach connections to Cobram and Tocumwal.",
    status: "operational",
    stations: [
      SCC,
      s("Broadmeadows", -37.6833, 144.9167),
      s("Wallan", -37.4167, 144.9833),
      s("Kilmore East", -37.3, 144.95),
      s("Broadford", -37.2, 145.05),
      SEYMOUR,
      s("Avenel", -36.9, 145.2333, { suburb: "Avenel" }),
      s("Nagambie", -36.7833, 145.15, { suburb: "Nagambie", facilities: "Waiting room · Parking" }),
      s("Murchison East", -36.6167, 145.2167, { suburb: "Murchison East", facilities: "Parking" }),
      SHEPPARTON,
    ],
  },
  {
    slug: "albury",
    name: "Albury Line",
    code: "ALB",
    colour: "#c084fc",
    region: "Hume",
    description:
      "The interstate standard-gauge corridor to the Murray, via Benalla, Wangaratta and Wodonga to Albury.",
    origin: "Southern Cross",
    destination: "Albury",
    servicePattern: "Several services each day with reserved seating. Journey time is approximately three and a half hours.",
    status: "operational",
    stations: [
      SCC,
      s("Broadmeadows", -37.6833, 144.9167),
      s("Wallan", -37.4167, 144.9833),
      SEYMOUR,
      s("Benalla", -36.55, 145.9833, {
        suburb: "Benalla",
        facilities: "Staffed · Waiting room · Parking",
        connections: "Local buses",
      }),
      s("Wangaratta", -36.3583, 146.3167, {
        suburb: "Wangaratta",
        facilities: "Staffed · Waiting room · Toilets · Parking",
        connections: "Local buses · Coach connections",
      }),
      s("Wodonga", -36.1167, 146.8833, {
        suburb: "Wodonga",
        facilities: "Staffed · Parking",
        connections: "Local buses",
      }),
      ALBURY,
    ],
  },
  {
    slug: "gippsland",
    name: "Gippsland Line",
    code: "GIP",
    colour: "#f472b6",
    region: "Gippsland",
    description:
      "Runs east through the Latrobe Valley from Pakenham via Warragul, Moe, Morwell, Traralgon and Sale to Bairnsdale.",
    origin: "Southern Cross",
    destination: "Bairnsdale",
    servicePattern: "Frequent services to Traralgon, with a smaller number of services continuing to Sale and Bairnsdale.",
    status: "major_delay",
    stations: [
      SCC,
      s("Richmond", -37.8183, 145.0, { suburb: "Richmond", connections: "Metro Trains · Yarra Trams" }),
      s("Caulfield", -37.8772, 145.0236, { suburb: "Caulfield", connections: "Metro Trains" }),
      s("Clayton", -37.9256, 145.1186, { suburb: "Clayton", connections: "Metro Trains" }),
      s("Dandenong", -37.9833, 145.2, { suburb: "Dandenong", connections: "Metro Trains · Local buses" }),
      s("Pakenham", -38.0833, 145.4833, { suburb: "Pakenham", facilities: "Parking", connections: "Metro Trains · Local buses" }),
      s("Warragul", -38.1667, 145.9333, { suburb: "Warragul", facilities: "Staffed · Parking" }),
      s("Moe", -38.1667, 146.2667, { suburb: "Moe", facilities: "Staffed · Parking" }),
      s("Morwell", -38.2333, 146.4, { suburb: "Morwell", facilities: "Parking" }),
      TRARALGON,
      s("Sale", -38.1, 147.0667, {
        suburb: "Sale",
        facilities: "Staffed · Waiting room · Parking",
        connections: "Coach connections to Yarram and Loch Sport",
      }),
      s("Bairnsdale", -37.8333, 147.6167, {
        suburb: "Bairnsdale",
        facilities: "Staffed · Waiting room · Toilets · Parking",
        connections: "Coach connections to Lakes Entrance and Orbost",
      }),
    ],
  },
];

