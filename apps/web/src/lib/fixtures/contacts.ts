import { faker } from "@faker-js/faker";

export interface MockContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export function createContact(overrides: Partial<MockContact> = {}): MockContact {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    role: faker.helpers.arrayElement([
      "Owner",
      "Production Manager",
      "Accounts Payable",
      "Designer",
    ]),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    isPrimary: false,
    ...overrides,
  };
}

export function createContacts(count: number): MockContact[] {
  const contacts = Array.from({ length: count }, () => createContact());
  if (contacts.length > 0) {
    contacts[0].isPrimary = true;
  }
  return contacts;
}
