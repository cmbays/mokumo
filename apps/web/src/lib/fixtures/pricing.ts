import { faker } from "@faker-js/faker";

export interface MockPricingTemplate {
  id: string;
  name: string;
  method: string;
  basePrice: string;
  discount: string;
}

export function createPricingTemplate(
  overrides: Partial<MockPricingTemplate> = {},
): MockPricingTemplate {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    method: faker.helpers.arrayElement(["Screen Print", "Direct to Garment", "Embroidery", "DTF"]),
    basePrice: `$${faker.number.float({ min: 3, max: 20, fractionDigits: 2 })}/unit`,
    discount: faker.helpers.arrayElement([
      "None",
      "10% volume (100+)",
      "15% repeat order",
      "5% bulk",
    ]),
    ...overrides,
  };
}

export function createPricingTemplates(count: number): MockPricingTemplate[] {
  return Array.from({ length: count }, () => createPricingTemplate());
}
