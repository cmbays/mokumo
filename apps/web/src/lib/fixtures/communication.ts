import { faker } from "@faker-js/faker";

export interface MockMessage {
  id: string;
  direction: "inbound" | "outbound";
  channel: string;
  subject: string;
  preview: string;
  timestamp: string;
}

export function createMessage(overrides: Partial<MockMessage> = {}): MockMessage {
  return {
    id: faker.string.uuid(),
    direction: faker.helpers.arrayElement(["inbound", "outbound"] as const),
    channel: faker.helpers.arrayElement(["Email", "Portal", "Phone"]),
    subject: faker.lorem.sentence({ min: 3, max: 6 }),
    preview: faker.lorem.sentence({ min: 8, max: 15 }),
    timestamp: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}

export function createMessages(count: number): MockMessage[] {
  return Array.from({ length: count }, () => createMessage());
}
