// Mokumo shop vertical.
// Customers, shops, sequences, garments, quotes, orders, and invoices migrate here in Stage 3.

pub mod activity;
pub mod customer;

pub use activity::ActivityAction;
pub use customer::{
    CreateCustomer, Customer, CustomerId, CustomerRepository, SqliteCustomerRepository,
    UpdateCustomer,
};
