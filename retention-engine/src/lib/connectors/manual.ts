import type { CourseConnector } from "./types";

/** For clients whose students are added one at a time from the dashboard, no platform sync. */
export const manualConnector: CourseConnector = {
  id: "manual",
  label: "Manual entry (no platform connection)",
  supportsFullData: true,
  configFields: [],
  async fetchStudents() {
    return [];
  },
};
