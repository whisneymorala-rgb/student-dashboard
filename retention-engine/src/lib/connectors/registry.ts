import { csvConnector } from "./csv";
import { manualConnector } from "./manual";
import { teachableConnector } from "./teachable";
import { thinkificConnector } from "./thinkific";
import type { CourseConnector } from "./types";

export const connectors: Record<CourseConnector["id"], CourseConnector> = {
  teachable: teachableConnector,
  thinkific: thinkificConnector,
  csv: csvConnector,
  manual: manualConnector,
};

export function getConnector(id: CourseConnector["id"]): CourseConnector {
  const connector = connectors[id];
  if (!connector) throw new Error(`Unknown course platform connector: ${id}`);
  return connector;
}

export const connectorList = Object.values(connectors);
