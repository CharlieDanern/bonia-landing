#!/usr/bin/env node
// Writes src/data/hotelSchema.js as JSON, for the backend's AI import and the
// voice agent's prompt generator (one schema, three repos).
//   node scripts/export-schema.mjs > ../../../bonia-backend/src/data/hotel-schema.json
import { FIELDS, ROOM_FIELDS, SECTIONS, SOURCE_LABEL, SYSTEM_RULES } from "../src/data/hotelSchema.js";
process.stdout.write(`${JSON.stringify({ version: 1, generatedFrom: "bonia-landing reception-app/src/data/hotelSchema.js", FIELDS, ROOM_FIELDS, SECTIONS, SOURCE_LABEL, SYSTEM_RULES }, null, 2)}\n`);
