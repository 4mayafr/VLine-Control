import type { Line, Station } from "./types";

export type ResourceKind = "official" | "reference" | "map";

export interface ResourceLink {
  label: string;
  url: string;
  kind: ResourceKind;
  description: string;
}

const VLINE_TIMETABLES = "https://www.vline.com.au/Timetables/Train-coach-timetables";
const VLINE_SERVICE_CHANGES = "https://www.vline.com.au/Timetables/Service-changes";
const VLINE_STATIONS = "https://www.vline.com.au/Maps-stations-stops/Stations-stops";
const VLINE_PLAN_TRIP = "https://www.vline.com.au/Timetables/Plan-trip";
const PTV_DISRUPTIONS = "https://www.ptv.vic.gov.au/disruptions/";

function wikipediaSearch(query: string): string {
  return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
}

/** V/Line's station finder is driven by a town query parameter. */
function vlineStationSearch(station: Station): string {
  const town = (station.suburb || station.name)
    .replace(/\s+(NSW|VIC|Victoria)$/i, "")
    .split(",")[0]
    .trim();
  return `${VLINE_STATIONS}?search=town&value=${encodeURIComponent(town || station.name)}`;
}

export function lineResources(line: Line): ResourceLink[] {
  return [
    {
      label: "Train & coach timetables",
      url: VLINE_TIMETABLES,
      kind: "official",
      description: "Official V/Line master timetables for regional corridors.",
    },
    {
      label: "Planned service changes",
      url: VLINE_SERVICE_CHANGES,
      kind: "official",
      description: "Works and timetable alterations published by V/Line.",
    },
    {
      label: "Stations & stops finder",
      url: VLINE_STATIONS,
      kind: "official",
      description: "Search official station and stop information by line or town.",
    },
    {
      label: "PTV disruptions",
      url: PTV_DISRUPTIONS,
      kind: "official",
      description: "Network-wide disruptions published by Public Transport Victoria.",
    },
    {
      label: `Wikipedia — ${line.name}`,
      url: wikipediaSearch(`${line.name} V/Line`),
      kind: "reference",
      description: "Background, history and route detail from Wikipedia.",
    },
  ];
}

export function stationResources(station: Station): ResourceLink[] {
  const lat = station.latitude.toFixed(5);
  const lng = station.longitude.toFixed(5);
  return [
    {
      label: "V/Line station information",
      url: vlineStationSearch(station),
      kind: "official",
      description: "Opening hours, facilities, accessibility and ticketing for this town.",
    },
    {
      label: "Plan a journey",
      url: VLINE_PLAN_TRIP,
      kind: "official",
      description: "Official V/Line journey planning and ticket purchase.",
    },
    {
      label: `Wikipedia — ${station.name}`,
      url: wikipediaSearch(`${station.name} railway station Victoria`),
      kind: "reference",
      description: "Station history, platforms and prior names.",
    },
    {
      label: "Open in Google Maps",
      url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      kind: "map",
      description: `Approximate location ${lat}, ${lng} — check street access before travelling.`,
    },
    {
      label: "Open in OpenStreetMap",
      url: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
      kind: "map",
      description: "Street-level map with nearby transport and walking routes.",
    },
  ];
}

export const RESOURCE_KIND_LABEL: Record<ResourceKind, string> = {
  official: "Official",
  reference: "Reference",
  map: "Map",
};
