import { faker } from "@faker-js/faker";

/**
 * Body for POST /api/customers — matches Rust CreateCustomer struct.
 * Only display_name is required; all other fields are optional.
 */
export type CreateCustomerBody = {
  display_name: string;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  notes?: string | null;
  portal_enabled?: boolean | null;
  tax_exempt?: boolean | null;
  payment_terms?: string | null;
  credit_limit_cents?: number | null;
  lead_source?: string | null;
  tags?: string | null;
};

export function createCustomer(overrides: Partial<CreateCustomerBody> = {}): CreateCustomerBody {
  return {
    display_name: faker.person.fullName(),
    company_name: faker.company.name(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    ...overrides,
  };
}
