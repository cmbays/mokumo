import { faker } from "@faker-js/faker";

export interface MockArtwork {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  dimensions: string;
}

export function createArtwork(overrides: Partial<MockArtwork> = {}): MockArtwork {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    type: faker.helpers.arrayElement([
      "Vector (AI)",
      "Raster (PSD)",
      "Vector (SVG)",
      "Raster (PNG)",
    ]),
    uploadedAt: faker.date.recent({ days: 90 }).toISOString().split("T")[0],
    dimensions: `${faker.number.int({ min: 2, max: 14 })}" x ${faker.number.int({ min: 2, max: 14 })}"`,
    ...overrides,
  };
}

export function createArtworkList(count: number): MockArtwork[] {
  return Array.from({ length: count }, () => createArtwork());
}
