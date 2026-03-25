use mokumo_core::customer::traits::CustomerRepository;
use mokumo_core::customer::{CreateCustomer, Customer, CustomerId, UpdateCustomer};
use mokumo_core::error::DomainError;
use mokumo_core::filter::IncludeDeleted;
use mokumo_core::pagination::PageParams;
use sqlx::SqlitePool;

use crate::db_err;

#[derive(sqlx::FromRow)]
struct CustomerRow {
    id: String,
    company_name: Option<String>,
    display_name: String,
    email: Option<String>,
    phone: Option<String>,
    address_line1: Option<String>,
    address_line2: Option<String>,
    city: Option<String>,
    state: Option<String>,
    postal_code: Option<String>,
    country: Option<String>,
    notes: Option<String>,
    portal_enabled: bool,
    portal_user_id: Option<String>,
    tax_exempt: bool,
    tax_exemption_certificate_path: Option<String>,
    tax_exemption_expires_at: Option<String>,
    payment_terms: Option<String>,
    credit_limit_cents: Option<i64>,
    stripe_customer_id: Option<String>,
    quickbooks_customer_id: Option<String>,
    lead_source: Option<String>,
    tags: Option<String>,
    created_at: String,
    updated_at: String,
    deleted_at: Option<String>,
}

fn row_to_customer(row: CustomerRow) -> Result<Customer, DomainError> {
    let id = uuid::Uuid::parse_str(&row.id).map_err(|e| DomainError::Internal {
        message: format!("invalid UUID in database: {e}"),
    })?;
    Ok(Customer {
        id: CustomerId::new(id),
        company_name: row.company_name,
        display_name: row.display_name,
        email: row.email,
        phone: row.phone,
        address_line1: row.address_line1,
        address_line2: row.address_line2,
        city: row.city,
        state: row.state,
        postal_code: row.postal_code,
        country: row.country,
        notes: row.notes,
        portal_enabled: row.portal_enabled,
        portal_user_id: row.portal_user_id,
        tax_exempt: row.tax_exempt,
        tax_exemption_certificate_path: row.tax_exemption_certificate_path,
        tax_exemption_expires_at: row.tax_exemption_expires_at,
        payment_terms: row.payment_terms,
        credit_limit_cents: row.credit_limit_cents,
        stripe_customer_id: row.stripe_customer_id,
        quickbooks_customer_id: row.quickbooks_customer_id,
        lead_source: row.lead_source,
        tags: row.tags,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at,
    })
}

pub struct SqliteCustomerRepo {
    pool: SqlitePool,
}

impl SqliteCustomerRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}

impl CustomerRepository for SqliteCustomerRepo {
    async fn find_by_id(
        &self,
        id: &CustomerId,
        filter: IncludeDeleted,
    ) -> Result<Option<Customer>, DomainError> {
        let include = matches!(filter, IncludeDeleted::IncludeDeleted);
        let row = sqlx::query_as::<_, CustomerRow>(
            "SELECT * FROM customers WHERE id = ?1 AND (deleted_at IS NULL OR ?2)",
        )
        .bind(id.to_string())
        .bind(include)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        row.map(row_to_customer).transpose()
    }

    async fn list(
        &self,
        params: PageParams,
        filter: IncludeDeleted,
    ) -> Result<(Vec<Customer>, i64), DomainError> {
        let include = matches!(filter, IncludeDeleted::IncludeDeleted);

        let count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM customers WHERE (deleted_at IS NULL OR ?1)")
                .bind(include)
                .fetch_one(&self.pool)
                .await
                .map_err(db_err)?;

        let rows: Vec<CustomerRow> = sqlx::query_as(
            "SELECT * FROM customers WHERE (deleted_at IS NULL OR ?1) \
             ORDER BY created_at DESC LIMIT ?2 OFFSET ?3",
        )
        .bind(include)
        .bind(params.per_page() as i64)
        .bind(params.offset() as i64)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        let customers: Vec<Customer> = rows
            .into_iter()
            .map(row_to_customer)
            .collect::<Result<_, _>>()?;
        Ok((customers, count))
    }

    async fn create(&self, req: &CreateCustomer) -> Result<Customer, DomainError> {
        let id = CustomerId::generate();
        let portal_enabled = req.portal_enabled.unwrap_or(false);
        let tax_exempt = req.tax_exempt.unwrap_or(false);

        let row = sqlx::query_as::<_, CustomerRow>(
            "INSERT INTO customers (\
                id, display_name, company_name, email, phone, \
                address_line1, address_line2, city, state, postal_code, country, \
                notes, portal_enabled, tax_exempt, payment_terms, credit_limit_cents, \
                lead_source, tags\
            ) VALUES (\
                ?1, ?2, ?3, ?4, ?5, \
                ?6, ?7, ?8, ?9, ?10, ?11, \
                ?12, ?13, ?14, ?15, ?16, \
                ?17, ?18\
            ) RETURNING *",
        )
        .bind(id.to_string())
        .bind(&req.display_name)
        .bind(&req.company_name)
        .bind(&req.email)
        .bind(&req.phone)
        .bind(&req.address_line1)
        .bind(&req.address_line2)
        .bind(&req.city)
        .bind(&req.state)
        .bind(&req.postal_code)
        .bind(req.country.as_deref().unwrap_or("US"))
        .bind(&req.notes)
        .bind(portal_enabled)
        .bind(tax_exempt)
        .bind(req.payment_terms.as_deref().unwrap_or("due_on_receipt"))
        .bind(req.credit_limit_cents)
        .bind(&req.lead_source)
        .bind(&req.tags)
        .fetch_one(&self.pool)
        .await
        .map_err(db_err)?;

        row_to_customer(row)
    }

    async fn update(&self, id: &CustomerId, req: &UpdateCustomer) -> Result<Customer, DomainError> {
        let result = sqlx::query(
            "UPDATE customers SET \
                display_name = COALESCE(?1, display_name), \
                company_name = COALESCE(?2, company_name), \
                email = COALESCE(?3, email), \
                phone = COALESCE(?4, phone), \
                address_line1 = COALESCE(?5, address_line1), \
                address_line2 = COALESCE(?6, address_line2), \
                city = COALESCE(?7, city), \
                state = COALESCE(?8, state), \
                postal_code = COALESCE(?9, postal_code), \
                country = COALESCE(?10, country), \
                notes = COALESCE(?11, notes), \
                portal_enabled = COALESCE(?12, portal_enabled), \
                tax_exempt = COALESCE(?13, tax_exempt), \
                payment_terms = COALESCE(?14, payment_terms), \
                credit_limit_cents = COALESCE(?15, credit_limit_cents), \
                lead_source = COALESCE(?16, lead_source), \
                tags = COALESCE(?17, tags) \
            WHERE id = ?18 AND deleted_at IS NULL",
        )
        .bind(&req.display_name)
        .bind(&req.company_name)
        .bind(&req.email)
        .bind(&req.phone)
        .bind(&req.address_line1)
        .bind(&req.address_line2)
        .bind(&req.city)
        .bind(&req.state)
        .bind(&req.postal_code)
        .bind(&req.country)
        .bind(&req.notes)
        .bind(req.portal_enabled)
        .bind(req.tax_exempt)
        .bind(&req.payment_terms)
        .bind(req.credit_limit_cents)
        .bind(&req.lead_source)
        .bind(&req.tags)
        .bind(id.to_string())
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        if result.rows_affected() == 0 {
            return Err(DomainError::NotFound {
                entity: "customer",
                id: id.to_string(),
            });
        }

        // Re-fetch to get post-trigger updated_at
        let row = sqlx::query_as::<_, CustomerRow>("SELECT * FROM customers WHERE id = ?1")
            .bind(id.to_string())
            .fetch_one(&self.pool)
            .await
            .map_err(db_err)?;

        row_to_customer(row)
    }

    async fn soft_delete(&self, id: &CustomerId) -> Result<Customer, DomainError> {
        let result = sqlx::query(
            "UPDATE customers SET deleted_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') \
             WHERE id = ?1 AND deleted_at IS NULL",
        )
        .bind(id.to_string())
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        if result.rows_affected() == 0 {
            return Err(DomainError::NotFound {
                entity: "customer",
                id: id.to_string(),
            });
        }

        // Re-fetch to get post-trigger state (deleted_at + updated_at)
        let row = sqlx::query_as::<_, CustomerRow>("SELECT * FROM customers WHERE id = ?1")
            .bind(id.to_string())
            .fetch_one(&self.pool)
            .await
            .map_err(db_err)?;

        row_to_customer(row)
    }
}
