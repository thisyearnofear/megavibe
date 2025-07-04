#!/usr/bin/env node
/**
 * Extract Events for FilCDN
 *
 * This script extracts event data from our seed-events.js file
 * and reformats it for upload to FilCDN.
 *
 * Usage:
 *   node scripts/extract-events-for-filcdn.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Random coordinates for major blockchain cities
const cityCoordinates = {
  "Bali, Indonesia": { lat: -8.4095, lng: 115.1889 },
  "Warsaw, Poland": { lat: 52.2297, lng: 21.0122 },
  "Dortmund, Germany": { lat: 51.5136, lng: 7.4653 },
  "Seoul, South Korea": { lat: 37.5665, lng: 126.978 },
  "Zurich, Switzerland": { lat: 47.3769, lng: 8.5417 },
  Singapore: { lat: 1.3521, lng: 103.8198 },
  "Berlin, Germany": { lat: 52.52, lng: 13.405 },
  "London, UK": { lat: 51.5074, lng: -0.1278 },
  "Dubai, UAE": { lat: 25.2048, lng: 55.2708 },
  "Buenos Aires, Argentina": { lat: -34.6037, lng: -58.3816 },
  "Barcelona, Spain": { lat: 41.3851, lng: 2.1734 },
  "Lisbon, Portugal": { lat: 38.7223, lng: -9.1393 },
  "Miami, USA": { lat: 25.7617, lng: -80.1918 },
  "Denver, USA": { lat: 39.7392, lng: -104.9903 },
  "Dublin, Ireland": { lat: 53.3498, lng: -6.2603 },
  "Prague, Czech Republic": { lat: 50.0755, lng: 14.4378 },
  "Frankfurt, Germany": { lat: 50.1109, lng: 8.6821 },
  "Bratislava, Slovakia": { lat: 48.1486, lng: 17.1077 },
  "Sofia, Bulgaria": { lat: 42.6977, lng: 23.3219 },
};

// Function to get coordinates from location string
function getCoordinates(location) {
  if (cityCoordinates[location]) {
    return cityCoordinates[location];
  }

  // Default to a random location if city not found
  return {
    lat: (Math.random() * 180 - 90).toFixed(4) * 1,
    lng: (Math.random() * 360 - 180).toFixed(4) * 1,
  };
}

// Generate wallets for speakers
function generateWalletAddress() {
  return (
    "0x" +
    [...Array(40)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("")
  );
}

// Parse date string to actual date
function parseDateToISO(dateStr, year) {
  const months = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  // Handle TBA dates
  if (dateStr.includes("TBA")) {
    const month = Object.keys(months).find((m) => dateStr.includes(m)) || "Jan";
    return `${year}-${months[month]}-01T09:00:00Z`;
  }

  // Parse date range (e.g., "Aug 21–22, 2025")
  const match = dateStr.match(/([A-Za-z]+)\s+(\d+)(?:–\d+)?,\s+(\d{4})/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${months[month]}-${day.padStart(2, "0")}T09:00:00Z`;
  }

  // Default fallback
  return `${year}-01-01T09:00:00Z`;
}

// Extract events from the seed-events.js source
async function extractEvents() {
  console.log("Extracting events from seed-events.js...");

  try {
    // Read the file as string
    const seedEventsPath = path.join(__dirname, "seed-events.js");
    const fileContent = fs.readFileSync(seedEventsPath, "utf8");

    // Extract the events array
    const eventsMatch = fileContent.match(/const events = \[([\s\S]*?)\];/);
    if (!eventsMatch) {
      throw new Error("Could not find events array in seed-events.js");
    }

    // Parse event objects
    const eventsString = eventsMatch[1];
    const eventObjects = [];
    const eventMatches = eventsString.matchAll(/{([^{}]*)}/g);

    for (const match of eventMatches) {
      const eventText = match[0];

      // Extract fields
      const nameMatch = eventText.match(/name: "([^"]+)"/);
      const datesMatch = eventText.match(/dates: "([^"]+)"/);
      const locationMatch = eventText.match(/location: "([^"]+)"/);
      const highlightsMatch = eventText.match(/highlights: "([^"]+)"/);

      if (nameMatch && datesMatch && locationMatch && highlightsMatch) {
        const name = nameMatch[1];
        const dates = datesMatch[1];
        const location = locationMatch[1];
        const highlights = highlightsMatch[1];

        eventObjects.push({ name, dates, location, highlights });
      }
    }

    console.log(`Found ${eventObjects.length} events`);

    // Convert to FilCDN format
    const filcdnEvents = eventObjects.map((event, index) => {
      // Parse dates
      const year = event.dates.match(/\d{4}/)
        ? event.dates.match(/\d{4}/)[0]
        : "2025";
      const startDate = parseDateToISO(event.dates, year);

      // Calculate end date (1-3 days after start)
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3) + 1);

      // Generate 1-3 speakers
      const speakerCount = Math.floor(Math.random() * 3) + 1;
      const speakers = [];

      const names = [
        "Alex Wei",
        "Jamie Rodriguez",
        "Taylor Kim",
        "Jordan Chen",
        "Casey Johnson",
        "Morgan Smith",
        "Riley Davis",
        "Quinn Lee",
        "Avery Wong",
        "Blake Thompson",
        "Charlie Park",
        "Dakota Garcia",
        "Emerson Zhao",
        "Finley Nguyen",
        "Hayden Li",
      ];

      for (let i = 0; i < speakerCount; i++) {
        speakers.push({
          id: `speaker-${index + 1}-${i + 1}`,
          name: names[Math.floor(Math.random() * names.length)],
          walletAddress: generateWalletAddress(),
          profileImage: `https://example.com/speakers/profile-${
            Math.floor(Math.random() * 20) + 1
          }.jpg`,
        });
      }

      // Generate categories from highlights
      const highlightWords = event.highlights.toLowerCase().split(/,|\s+/);
      const categories = Array.from(
        new Set(
          highlightWords.filter(
            (word) =>
              word.length > 3 &&
              ![
                "with",
                "and",
                "the",
                "for",
                "focus",
                "event",
                "largest",
                "global",
              ].includes(word)
          )
        )
      ).slice(0, 5);

      // Generate coordinates
      const coordinates = getCoordinates(event.location);

      return {
        id: `event-${index + 1}`.padStart(9, "0"),
        title: event.name,
        description: event.highlights,
        startDate: startDate,
        endDate: endDate.toISOString(),
        venue: {
          name: `${event.location} Web3 Conference Center`,
          address: `${Math.floor(Math.random() * 999) + 1} Blockchain Avenue, ${
            event.location
          }`,
          coordinates: coordinates,
        },
        speakers: speakers,
        imageUrl: `https://example.com/events/${event.name
          .toLowerCase()
          .replace(/\s+/g, "-")}.jpg`,
        categories: categories,
      };
    });

    // Write to file
    const outputPath = path.join(
      __dirname,
      "..",
      "data",
      "scraped",
      "real-events.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(filcdnEvents, null, 2));

    console.log(
      `✅ Successfully extracted ${filcdnEvents.length} events to ${outputPath}`
    );
    return outputPath;
  } catch (error) {
    console.error("❌ Error extracting events:", error);
    throw error;
  }
}

// Run the extraction
extractEvents()
  .then((outputPath) => {
    console.log(
      `Run upload with: npm run upload:events -- --file ${outputPath} --verbose`
    );
  })
  .catch((error) => {
    console.error("Failed to extract events:", error);
    process.exit(1);
  });
