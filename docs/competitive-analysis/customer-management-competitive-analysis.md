---
title: 'Customer Management — Competitive Analysis'
description: 'Comprehensive analysis of customer management/CRM features across 9 screen printing and print shop management software competitors'
category: competitive-analysis
status: complete
phase: 1
vertical: customer-management
created: 2026-02-09
last-verified: 2026-02-09
---

# Customer Management — Competitive Analysis

**Purpose**: Document how the leading screen printing / print shop management platforms handle customer management, CRM, contacts, portals, and related features. This research drives product decisions for Mokumo's Customer Management vertical.

**Competitors Analyzed**: Printavo, ShopWorks (OnSite), InkSoft, GraphicsFlow, OrderMyGear (OMG), DecoNetwork, printIQ, Kothari Print Pro, Print Life

---

## 1. Printavo

**Category**: Screen printing shop management (most popular in the space)
**Pricing**: $49-$250/month
**Parent**: Inktavo (also owns InkSoft, GraphicsFlow)

### Customer Profile Management

- **Fields stored**: Full name, first name, company name, email address, phone number, billing address, shipping address
- **Tax settings**: Sales tax override per customer profile; tax-exempt status imports from QuickBooks Online
- **Payment terms**: Payment terms field available (importable via CSV); customer-stored billing for saved credit card information
- **Billing**: Customers can store credit cards, manage payment methods, edit expiration dates, nicknames, billing addresses, and contact info from their account

### Contact Management

- **Multiple contacts**: Yes. Main Contact and Additional Contacts per customer (synced from QuickBooks Online). Main contact is the Customer on the profile; additional contacts are listed separately.
- **Roles**: Primary/additional distinction but no formal role types (e.g., "billing contact", "art contact")
- **Address handling**: Billing and shipping addresses supported. Address on customer profile is copied to quotes at creation time and stored independently -- updating the profile does NOT retroactively update past quotes/invoices.

### Customer Communication

- **Built-in messaging**: Yes. Send and receive messages inside Printavo. Every message sent (manual or automated) attaches the related quote/invoice via a linked button.
- **Automation suite**: Flexible automation engine with customizable triggers, actions, CC/BCC recipients, and dynamic shortcodes for subject lines and body text. Automations can be named, labeled, sequenced, and filtered.
- **System-generated messages**: Printavo auto-generates certain system messages (payment requests, status updates) in addition to custom automations.
- **Communication history**: All messages logged per order. Payment request history is permanent.

### Customer Portal

- **Public Profile**: Each customer gets a shareable URL (Public Profile) where they can view all their quotes, invoices, and current order workflow status on their own time.
- **Printavo Merch**: Online store creation for group orders, fundraisers, team stores. Customers see orders, quotes, artwork approvals, and account balance in an organized dashboard. All email communications organized by order/quote.
- **Self-serve capabilities**: View quotes/invoices, track orders, approve artwork, make payments, track shipments (tracking info available on Public Invoice View once shipping labels are created).

### Customer History

- **Order history**: Full order history per customer. Searchable. Can pull up past orders from calendar to trigger reorder reminders.
- **Quote history**: All quotes visible on customer profile and public profile.
- **Communication logs**: Activity feed with timestamps for everything created/updated. Payment request history permanent.
- **Reorder workflow**: Can change status of past orders to "Reorder Reminder" to trigger automated customer outreach.

### Customer Segmentation / Tags

- **Tags**: Hash-tag-based tagging system (`#tag`). Tags can be applied to orders/invoices. Used for tracking print types, presses, print locations, people, tax types, etc.
- **No explicit customer-level tags** -- tags are primarily order-level.
- **Categories**: Line item categories transfer to QuickBooks as products/services.

### Pricing & Terms

- **Discounts**: Percentage-based or fixed-rate discounts per order/quote. No customer-level default discount.
- **Pricing matrix**: CSV-uploadable pricing matrix for quantity-based pricing.
- **Customer-specific payment methods**: Can toggle ACH or credit card payments on/off per customer.
- **Tax overrides**: Per-customer sales tax override in profile. Tax-exempt status syncs from QuickBooks.
- **Credit limits**: Not documented.

### Customer Notes

- **Customer Notes**: Visible to customer -- acknowledgments and passive communications (e.g., "Customer requested the smalls to be boxed separately").
- **Production Notes**: Internal only -- not visible to customer. For job-specific internal info.
- **Nickname**: Order/quote nickname for quick internal reference.

### Import / Export

- **CSV import**: Download template, paste customer data, upload CSV. Payment terms includable. Warning: imports create duplicates, do NOT merge with existing records.
- **CSV export**: One-click export of customer data as CSV spreadsheet, sent to email. Exportable by date range.
- **QuickBooks sync**: Bidirectional customer sync every 2 hours. Customers, invoices, transactions, tax-exempt status all synced.

### Integration

- **1000+ integrations**: QuickBooks Online, SanMar, AlphaBroder, S&S Activewear, Stripe, Google, ShipStation, InkSoft, Zapier.
- **Distributor catalogs**: Auto-fill line items from AlphaBroder, S&S, SanMar with daily-updated pricing.
- **Zapier**: Connect to 1000+ apps. API available for custom integrations.

### Search & Filtering

- **Global search**: Quick search for any customer, quote, or invoice.
- **Barcode scanning**: Attach scannable labels to boxes/work orders for instant order lookup.
- **Activities feed**: Chronological feed of all creations/updates with timestamps.

### Unique / Standout Features

- **Customer-stored billing** with PCI-compliant encrypted card storage
- **Automated reorder reminders** by changing past order status
- **Public Profile URL** as lightweight customer portal (no login required)
- **Printavo Merch** online stores with group ordering capability
- **Flexible automation engine** with any-trigger + any-action combinations

---

## 2. ShopWorks (OnSite)

**Category**: Enterprise-level print shop ERP
**Pricing**: Not publicly disclosed (enterprise pricing)
**Type**: Desktop-based (with web add-ons like ProofStuff)

### Customer Profile Management

- **Fields stored**: Standard business contact fields (name, company, address, phone, email). Full double-ledger accounting tied to customer records.
- **Tax settings**: Avalara AvaTax integration for automated sales tax calculation. Tax exemption certificate storage and management.
- **Payment terms**: Account-level payment terms. Integrated invoicing with A/R tracking.

### Contact Management

- **Prospect management**: Built-in prospect/lead tracking with lead scoring capabilities (OnSite 8.3+).
- **CRM features**: Marketing campaign effectiveness tracking, sales funnel management and reporting.
- **Multiple contacts**: Supported through the CRM module.

### Customer Communication

- **ProofStuff**: Web-based proofing system for art proof generation, approval, and follow-up. Automated email reminders. History tracking of all approvals and feedback. Digital signature support.
- **Bulk proofing**: Bulk art proofs and document approval capabilities.
- **Email**: Automated notifications for proofing workflows.

### Customer Portal

- **ProofStuff portal**: Customers approve artwork proofs, invoices, and other documents online. Supports multiple file formats (JPG, PNG, PDF up to 2MB).
- **ShopWorks Pay**: Customers can make payments anytime on any device via credit card and ACH gateway.
- **ManageOrders**: Web-based order management extension.

### Customer History

- **Order tracking**: Full order history, job costing, production records per customer.
- **Financial history**: A/R, A/P, general ledger, financial statements all integrated.
- **Design history**: Stores ink/thread colors, screen details, thumbnail images per customer/job.

### Customer Segmentation / Tags

- **Lead scoring**: Prioritize leads with scoring capabilities (OnSite 8.3+).
- **Sales funnel stages**: Track prospects through pipeline stages.
- **Marketing campaigns**: Track effectiveness of campaigns by customer segment.

### Pricing & Terms

- **Customer quotes**: Fast quoting via email with pricing downloaded from suppliers.
- **Full accounting**: Double-ledger accounting, A/R, A/P, payables, payment processing.
- **Job costing**: Detailed cost tracking per customer per job.

### Customer Notes

- **Task alerts**: Alert system tied to customer/job activities.
- **Internal notes**: Available within order/job context.

### Import / Export

- **Data import wizard**: Improved in OnSite 8.3 for faster, easier data importing.
- **EDP integration**: External Data Processor module for data exchange.

### Integration

- **E-commerce**: Magento, Etsy, BigCommerce, Shopify integrations.
- **Industry tools**: SAGE (promotional products), InkSoft, OrderMyGear, ShipStation, WooCommerce.
- **No QuickBooks**: Has its own built-in double-ledger accounting -- does NOT integrate with QuickBooks.
- **ShipStation**: Shipping integration.

### Search & Filtering

- **Centralized search**: All modules connected real-time in single integrated package.
- **Order tracking**: Comprehensive order lookup across all modules.

### Unique / Standout Features

- **Full ERP with built-in accounting** (no third-party accounting needed)
- **Lead scoring and sales funnel management** (rare in print shop software)
- **ProofStuff digital signature** for legally binding art approvals
- **Avalara AvaTax integration** for automated tax compliance
- **Enterprise-grade**: Handles the largest print shops with complex requirements

---

## 3. InkSoft

**Category**: E-commerce platform + print shop management
**Pricing**: ~$3,600/year for 5 team members + $1,000 one-time license fee
**Parent**: Inktavo (also owns Printavo, GraphicsFlow)

### Customer Profile Management

- **Fields stored**: First name, last name, email, phone number, date of most recent order. Multiple addresses per contact.
- **Company association**: Each contact can be associated with one company/organization.
- **Client vs. Prospect**: Automatic classification -- "client" has completed at least one order; "prospect" has created an account but not ordered.

### Contact Management

- **Companies**: Collection of contacts grouped under a company. Serves as the "main focal point of how multiple contacts come together."
- **Multiple addresses**: Multiple addresses can be entered per contact.
- **Mobile CRM**: Fully mobile-responsive CRM -- sales reps can add companies/contacts from the field.

### Customer Communication

- **Order status updates**: Customers receive confirmation emails with permanent links to their orders.
- **Approval workflows**: Configurable order approval settings -- determine which orders require shop approval before processing.
- **Store Performance Dashboard**: Customers can monitor profitability and success of their storefronts (revenue, fundraising progress, sales metrics).

### Customer Portal

- **Customer Portal**: Self-serve reorder portal. Customers can set up reorders at their convenience without waiting for shop to open.
- **Order access**: Customers with accounts access receipts, reordering, and order status updates through login portal.
- **Guest access**: Guest customers receive confirmation email with permanent link to order details -- works even after store/campaign closes.
- **Store admin panel**: Customers with stores get dashboards tracking revenue, fundraising, sales metrics.

### Customer History

- **Order history**: Full order history per contact and company.
- **Notes**: Notes taken by shop team visible on contact records.
- **CRM Report**: Dedicated reporting on customer data -- names, most recent order date, email, phone.

### Customer Segmentation / Tags

- **Tags**: Custom keywords to sort, filter, and group customers. Help "remember where and when you first connected with a contact or company."
- **Tag Manager**: Edit, delete, and purge unused tags.
- **Filter Results**: Toggle through Companies and Contacts with filter functionality.

### Pricing & Terms

- **Quantity discounts**: Associated with product price (blank products and pre-decorated items).
- **Coupons & automatic discounts**: Coupon codes, hidden coupon codes, automatic discounts. Maximum usage per customer tracking.
- **Pricing rules**: Supplier cost markup with configurable up-charge rules.
- **Custom tax rates**: Configurable per store/customer.

### Customer Notes

- **Contact notes**: Notes by team members visible on contact detail view.
- **Order-level notes**: Notes associated with specific orders.

### Import / Export

- **QuickBooks export**: Export confirmed invoices and orders to QuickBooks Online.
- **Customer data**: CRM report exports customer data.
- **ShipStation integration**: Order data export for shipping.

### Integration

- **Printavo integration**: Available for InkSoft Unlimited + Printavo Premium subscribers. Orders flow from InkSoft to Printavo.
- **ShipStation**: Shipping integration.
- **QuickBooks Online**: Invoice and order export.
- **Not natively integrated**: Despite being under the Inktavo umbrella, InkSoft, Printavo, and GraphicsFlow require separate subscriptions and logins.

### Search & Filtering

- **Filter Results**: Built-in filtering when toggling through companies and contacts.
- **Tag-based search**: Search and filter by custom tags.

### Unique / Standout Features

- **Client vs. Prospect auto-classification** based on order history
- **Mobile-responsive CRM** for field sales reps
- **Store Performance Dashboard** giving customers visibility into their storefront metrics
- **Self-serve reorder portal** reducing communication friction
- **Hidden coupon codes** for targeted promotions without visible discount fields

---

## 4. GraphicsFlow

**Category**: Art approval and production management (focused on design workflow)
**Pricing**: Varies by plan
**Parent**: Inktavo (also owns Printavo, InkSoft)

### Customer Profile Management

- **Minimal customer profiles**: Email addresses auto-saved when art approvals are sent. Not a traditional CRM.
- **Fields stored**: Primarily email addresses, names linked to art approval workflows.

### Contact Management

- **Multiple recipients per approval**: Add multiple people to a single art approval.
- **Auto-saved contacts**: Customer email saved automatically after first approval interaction.
- **Repeat orders**: Quick contact lookup for returning customers.

### Customer Communication

- **Art Approval workflow**: Primary communication channel. Send proofs, receive comments and feedback.
- **Comment system**: Customers can add comments to approvals for change requests.
- **Event tracking**: Real-time timeline of all actions during the approval process.
- **Notifications**: Instant alerts when customers review artwork.

### Customer Portal

- **Art Portal**: Embeddable art catalog with 25,000+ designs. Customers browse, filter by category/style, and submit design requests.
- **Design Request forms**: Customizable forms with custom fields for customers to submit art requests.
- **Self-service browsing**: Customers search designs, clip art, fonts by category and style.

### Customer History

- **Art history**: Cloud-based storage of all customer artwork and designs.
- **Approval verification log**: Timestamped log of when customers reviewed artwork -- reduces miscommunication disputes.
- **Version tracking**: Track changes and iterations through approval process.

### Customer Segmentation / Tags

- **Custom tags on artwork**: Tags for organizing customer graphics by style, subject matter, or customer segment.
- **Folders and subfolders**: Organize customer artwork in hierarchical folder structure.

### Pricing & Terms

- **Not applicable**: GraphicsFlow is design-focused, not pricing/invoicing.

### Customer Notes

- **Approve/Reject notes**: Customers and shop staff can add notes during approval process.
- **Design request notes**: Custom fields on design request forms capture project context.

### Import / Export

- **Direct upload**: Bulk upload folders of artwork.
- **No customer CSV import/export**: Not a traditional CRM.

### Integration

- **Inktavo ecosystem**: Works alongside Printavo (production) and InkSoft (e-commerce) but NOT natively integrated.
- **Embeddable Art Portal**: Embed on any website.

### Search & Filtering

- **Design search**: Filter by category, style, subject matter, customer tags.
- **Quick contact lookup**: Find customers by email to resend or create new approvals.

### Unique / Standout Features

- **Only tool in the industry** for creating and finalizing customer artwork entirely online
- **Art Approval Event Tracking** with timestamped verification log
- **Embeddable Art Portal** with 25,000+ stock designs
- **Customizable Design Request forms** with custom fields
- **Not a CRM** -- purely design/art workflow focused

---

## 5. OrderMyGear (OMG)

**Category**: Group ordering and fulfillment for branded merchandise
**Pricing**: Month-to-month subscriptions, no contracts (tiered plans)

### Customer Profile Management

- **Fields stored**: Company contacts with role-based assignments (Orders, Artwork, Billing).
- **Supplier data**: Separate supplier contact database alongside customer contacts.
- **Tax settings**: Automated tax calculation via TaxJar, Avalara, or Tax Cloud.

### Contact Management

- **Role-based contacts**: Set up company contacts specifically for Orders, Artwork, Billing, and other functions.
- **Add/edit contacts**: Flexible contact management per company.
- **Supplier contacts**: Separate contact management for suppliers/vendors.

### Customer Communication

- **Email templates**: Customizable email templates for customer communications.
- **Customer updates**: Centralized customer update management from one platform.
- **Order notifications**: Status updates sent to customers throughout order lifecycle.

### Customer Portal

- **Order Hub**: Real-time order status view for customers. Customers can view and approve proofs and quotes, and pay for orders.
- **No back-and-forth**: Designed to eliminate email-based proof and quote approval cycles.
- **Group Passcodes**: Control store visibility through group passcodes (Premium tier).

### Customer History

- **Order history**: Full order tracking across all sales channels (Presentations, Online Stores, manual entry).
- **Sales data**: View sales and accounting data per customer.
- **Cross-channel visibility**: Orders from any source visible in one place.

### Customer Segmentation / Tags

- **Custom statuses**: Create custom order statuses that match internal processes.
- **Group management**: Organize customers by groups (companies, teams, schools, clubs, organizations).
- **No explicit customer tags** documented.

### Pricing & Terms

- **Quote management**: Full quoting with customer approval workflow.
- **Invoice management**: Invoicing with payment tracking.
- **Stripe payments**: Online payment processing via Stripe.
- **Supplier POs**: Purchase order management for supplier ordering.

### Customer Notes

- **Order-level notes**: Notes within order management workflow.
- **Artwork notes**: Notes attached to artwork approvals.

### Import / Export

- **Data upload**: Upload existing customer and supplier data during onboarding.
- **Integration-based import**: Connect with existing OMG solutions for data transfer.

### Integration

- **Accounting**: Built-in accounting tools.
- **Shop management**: Integrates with shop management software.
- **Shipping**: Link shipping accounts (FedEx, UPS, etc.).
- **APIs**: Custom integration via API.
- **Print-on-demand**: POD service integrations.
- **ERP systems**: Enterprise integration capabilities.

### Search & Filtering

- **Cross-channel search**: Find orders regardless of source (Presentation, Online Store, manual).
- **Customer lookup**: Search customer and supplier databases.

### Unique / Standout Features

- **Order Hub** -- customer-facing real-time order tracker with proof/quote approval and payment
- **Presentations**: Create visual product presentations for customer pitches
- **Group ordering**: Purpose-built for group/team ordering with individual member purchasing
- **Role-based contacts** (Orders, Artwork, Billing) per company
- **Multi-source order aggregation** -- orders from all channels in one view

---

## 6. DecoNetwork

**Category**: All-in-one print shop e-commerce + management
**Pricing**: Tiered plans (includes Premium & Enterprise tiers)

### Customer Profile Management

- **Fields stored**: Standard fields (name, email, phone, address) plus custom fields defined by admin.
- **Custom fields**: Add unlimited custom customer fields from Fulfillment Center Admin. Custom fields available in exports.
- **Companies**: Separate Company entity with billing details, shipping details, and account holder terms.
- **Separate shipping address**: Enable per company; independent from billing address.
- **Customer discount**: Percentage discount field per customer.
- **Sales team assignment**: Assign a sales team member to a company -- all orders auto-assigned to that rep.

### Contact Management

- **Companies + Customers**: Two-tier system. Companies contain multiple customer contacts.
- **Company contacts**: View order history, communication, and contacts within a company.
- **Account holders**: Companies can be set as account holders with pre-defined payment terms.

### Customer Communication

- **Send notes to customer**: Direct notes from quotes/orders, delivered via email AND displayed in customer-visible History.
- **Artwork approval notes**: Send notes specifically about artwork approval status.
- **Automated emails**: Abandoned cart follow-ups, order status notifications, promotional emails, promo codes.
- **Email templates**: Customizable templates for automated notifications to customers, staff, suppliers, and campaign owners.
- **Correspondence settings**: Control logo, invoice attachments, default marketing messages.

### Customer Portal

- **Online registration**: Customers register, save details, and reuse login across affiliate stores.
- **Customer account**: View orders, track status, manage account details.
- **Branded online stores**: Customers can have their own branded storefronts.

### Customer History

- **Account Activity view**: Dedicated "View a Customer's Account Activity" feature.
- **Order history**: Full order history per customer and per company.
- **Artwork history**: Previously used artwork stored and accessible.
- **Communication history**: All notes (sent and received) saved with quotes/orders in History/Notes tab.
- **Sales summary popup**: Hover over customer name in any list to see sales summary popup.

### Customer Segmentation / Tags

- **Contract Price Levels**: Multiple pricing tiers assignable to stores and customers (Premium & Enterprise only).
- **Customer types**: Active, Deleted, Spam tabs for customer filtering.
- **Company groups**: Group customers under companies for organizational segmentation.
- **No explicit tag system** documented (segmentation via companies and price levels).

### Pricing & Terms

- **Contract Price Levels**: Multiple pricing tiers per customer/store. Configure retail vs. wholesale pricing.
- **Volume discounts**: Configurable per price level (can be disabled for already-discounted levels).
- **Supplier product markup**: Fixed amount or tiered markup based on product base cost. Tailored per contract price level.
- **Account holder terms**: Pre-defined payment terms for companies, applied to all web store orders.
- **Tax exemption**: Checkbox to exempt customers belonging to a company from configured taxes.
- **Coupon codes**: Promotional discount codes.
- **Store-level pricing**: Override decoration pricing at the store level.

### Customer Notes

- **Customer-facing notes**: Sent via email, displayed in quote/order History section visible to customer.
- **Internal notes**: Private notes on quotes/orders. Optionally emailed to Admin-role team members. Can include file attachments.
- **Production item notes**: Internal notes on specific production items.

### Import / Export

- **CSV import**: Column headers auto-matched to customer fields. Supports custom fields. Updates existing records by matching ID, email, or login. Creates new records for unmatched data.
- **CSV export**: Export customers and companies as CSV.
- **Smart record matching**: Uses ID, email, or login fields to update vs. create on import.
- **Custom field import**: Must create custom fields in admin before importing custom field data.

### Integration

- **QuickBooks Online**: One-way sync from DecoNetwork. Customer sync options: individual accounts for all, or shared account for internet orders.
- **QuickBooks Desktop**: Integration available.
- **Xero**: One-way sync from DecoNetwork with similar customer sync options.
- **Zoho CRM**: Sync customers as Contacts (purchasers) and Leads (registered non-purchasers/newsletter subscribers).
- **ShipStation, Stripe**: Shipping and payment integrations.

### Search & Filtering

- **Customer list**: Business Hub > Customers with Active/Deleted/Spam tabs.
- **Search types**: Text search, dropdown filters, value range filters (To/From).
- **Customer popup**: Hover over customer name in any list for quick sales summary.
- **Companies List**: Centralized company view with linked orders and contacts.

### Unique / Standout Features

- **True all-in-one platform** -- quotes, mockups, artwork approvals, supplier catalogs, production tools, online stores, CRM all in one login
- **Custom customer fields** with import/export support
- **Contract Price Levels** for sophisticated customer-tier pricing
- **Sales team assignment** per company with auto-order routing
- **Zoho CRM sync** with Contact vs. Lead distinction
- **Smart CSV import** with record matching (ID/email/login)
- **Company-level tax exemption** inherited by all contacts

---

## 7. printIQ

**Category**: Print MIS/ERP (commercial and wide-format printing)
**Pricing**: Not publicly disclosed (contact sales)

### Customer Profile Management

- **Customer codes**: Each customer mapped to a unique printIQ Customer Code used across all estimates and orders.
- **Fields stored**: Contact information, product details, order history (synced to accounting).
- **Pricing agreements**: Customer-specific pricing agreements tracked.
- **Credit terms**: Credit terms management (passed to accounting integrations).

### Contact Management

- **Customer database**: Centralized customer records used across all modules.
- **Contact syncing**: Contacts synced to/from accounting systems and CRM platforms.

### Customer Communication

- **Portal-based communication**: Customers interact via portal for quotes, orders, status updates.
- **Automated purchasing**: System-generated communications for order and purchasing workflows.

### Customer Portal

- **Built-in customer portal**: Customers log on to request quotes (with instant pricing), see stock levels, place orders.
- **SmartSite**: Copy-paste code widget to embed ordering on any website.
- **Mobile-ready**: Portal works on phone, tablet, and desktop.
- **No full storefront needed**: Portal serves customers who don't need a dedicated storefront.

### Customer History

- **Full order history**: Complete estimate, order, and production history per customer.
- **Document management**: Full document and asset management from one system.
- **Job tracking**: Comprehensive production records tied to customer accounts.

### Customer Segmentation / Tags

- **Not documented in detail**: Likely available through CRM integration (HubSpot/Zoho).

### Pricing & Terms

- **Customer-specific pricing**: Pricing agreements per customer.
- **Instant quoting**: Customers can see quotes instantly through portal.
- **Credit terms**: Managed per customer (details passed to accounting).

### Customer Notes

- **Within order context**: Notes associated with estimates, orders, and production jobs.

### Import / Export

- **API-driven**: Extensive API library (IQconnect) for data import/export.
- **Accounting sync**: Contact and order data synced automatically to Xero/QuickBooks.

### Integration

- **Xero**: Seamless integration -- contact info, product details, order history sync.
- **QuickBooks**: Contact and order details sync without manual intervention.
- **HubSpot CRM**: API integration for customer and pipeline management.
- **Zoho CRM**: API integration for customer management.
- **Infigo**: Web-to-print storefront integration.
- **ERP partners**: Work with business efficiency specialists for CRM matching and setup.

### Search & Filtering

- **Centralized CRM view**: "One real-time, consistent view on one screen."
- **Cross-module search**: Search across estimates, orders, production, and accounting.

### Unique / Standout Features

- **Customer portal with instant quoting** -- customers see prices immediately
- **SmartSite embeddable widget** for adding ordering to any website
- **Modular architecture** supporting 8+ manufacturing processes
- **API-first design** (IQconnect) for maximum integration flexibility
- **Digital and traditional scheduling** tied to customer orders
- **Enterprise-grade MIS** for commercial/wide-format print operations

---

## 8. Kothari Print Pro

**Category**: Print production management / RIP software
**Type**: Desktop RIP and production software (NOT a CRM or shop management platform)

### Customer Profile Management

- **Not applicable**: Kothari Print Pro is RIP (Raster Image Processor) and production software, not a business management or CRM platform.
- **Job tracking**: Tracks jobs printed, print settings, number of copies, ink consumed -- but this is production data, not customer data.

### Contact Management

- **Not applicable**: No customer contact management.

### Customer Communication

- **Not applicable**: No customer-facing communication features.

### Customer Portal

- **Not applicable**: No customer portal.

### Customer History

- **Job accounting**: MIS-style reports on jobs printed, settings used, ink consumed. Tied to jobs, not customers.
- **Stored jobs**: RIPPED jobs stored on disk for future recall.

### Customer Segmentation / Tags

- **Not applicable**.

### Pricing & Terms

- **Ink cost calculator**: Compute print cost per job based on ink consumption -- useful for quoting, but not customer-specific pricing.

### Customer Notes

- **Not applicable**.

### Import / Export

- **XML-based workflow**: Barcode-controlled job automation via XML tickets. Web orders can auto-generate XML tickets placed in print queue.

### Integration

- **Printer integration**: Works with DTG, DTF, and direct-to-substrate printers.
- **Web order import**: XML-based integration with web ordering systems.

### Search & Filtering

- **Job queue search**: Search within job queue by various parameters.

### Unique / Standout Features

- **Not a CRM/shop management tool** -- purely a RIP and production management platform
- **Ink cost calculator** useful for informing pricing but not customer-facing
- **XML barcode workflow** for automated production from web orders

---

## 9. Print Life

**Category**: Screen printing shop management (newer/smaller platform)
**Pricing**: ~$30-80/month (estimated)
**Status**: 4Ink's current platform (our benchmark competitor)

### Customer Profile Management

- **Fields stored**: Customer name, contact information, addresses.
- **Tax-exempt filter**: Filter for tax-exempt clients to quickly identify which accounts are tax-exempt (added Q1 2025).
- **Limited fields**: Relatively basic customer profile compared to Printavo or DecoNetwork.

### Contact Management

- **Basic contacts**: Customer records with contact info.
- **No company/contact hierarchy** documented.
- **No multi-contact per company** documented.

### Customer Communication

- **Automated follow-up**: Automated customer notifications during production process (e.g., mock-up approval needed).
- **Production manager notifications**: Auto-notifies customer's print production manager at key stages.
- **Basic email**: Email communication for quotes and invoices.

### Customer Portal

- **Customer portal exists**: Customers can log in to view current orders, update addresses, and replicate previous orders.
- **Quote writing**: Customers can write their own screen print and embroidery orders based on shop-defined parameters.
- **Order replication**: Customers can replicate previous orders from their portal.
- **4Ink does NOT use the portal**: As noted in our user interview, 4Ink builds all quotes internally.

### Customer History

- **Order history**: Viewable through customer portal.
- **Previous order replication**: Customers can duplicate past orders.
- **Limited history features** compared to competitors.

### Customer Segmentation / Tags

- **Tax-exempt filter**: Quick filter to see tax-exempt accounts.
- **No tags, groups, or tiers** documented.

### Pricing & Terms

- **Auto-calculated pricing**: Based on garment base price + impression costs.
- **Matrix-based pricing**: Linear inches, linear feet, square feet matrices (added Q1 2025).
- **Price overrides**: Available on admin side.
- **No customer-specific pricing** documented.
- **No payment terms management** documented.

### Customer Notes

- **Not documented in detail**. Likely basic notes per order/quote.

### Import / Export

- **Not documented**. No CSV import/export features found.

### Integration

- **S&S Activewear**: Product catalog integration with live stock levels.
- **SanMar**: Catalog integration (had issues with missing products in 2024).
- **Alphabroder**: Catalog integration.
- **QuickBooks**: Integration for invoicing.
- **Limited integrations** overall compared to Printavo or DecoNetwork.

### Search & Filtering

- **Product search**: Search product catalog for quoting.
- **Tax-exempt filter**: Filter customers by tax-exempt status.
- **Basic search**: Limited advanced search/filter capabilities documented.

### Unique / Standout Features

- **Built by a screen printer** (Cam Earven, 10+ years experience)
- **Customer self-service quoting** (customers write own quotes from shop parameters)
- **Live vendor stock levels** in quoting flow
- **Delivery date selector** on quotes/invoices (hides turnaround time selector)
- **Solo developer** -- small but nimble, though "bus factor of 1" is a risk
- **In its infancy** -- actively developing based on user feedback

---

## Summary Comparison Table

### Core Customer Management Features

| Feature                           | Printavo           | ShopWorks          | InkSoft          | GraphicsFlow                 | OMG                  | DecoNetwork         | printIQ | Kothari | Print Life   |
| --------------------------------- | ------------------ | ------------------ | ---------------- | ---------------------------- | -------------------- | ------------------- | ------- | ------- | ------------ |
| **Customer profiles**             | Yes                | Yes                | Yes              | Minimal                      | Yes                  | Yes                 | Yes     | No      | Basic        |
| **Company/org entity**            | Via QBO            | Yes                | Yes              | No                           | Yes                  | Yes                 | Yes     | No      | No           |
| **Multiple contacts per company** | Yes                | Yes                | Yes              | Multiple per approval        | Yes (role-based)     | Yes                 | Yes     | No      | No           |
| **Contact roles**                 | Primary/Additional | CRM leads          | Client/Prospect  | N/A                          | Orders/Art/Billing   | Sales team assign   | N/A     | N/A     | N/A          |
| **Custom fields**                 | No                 | Limited            | No               | Custom design request fields | No                   | Yes                 | Via API | No      | No           |
| **Tax-exempt status**             | Yes (QBO sync)     | Yes (Avalara)      | Custom tax rates | N/A                          | Yes (TaxJar/Avalara) | Yes (company-level) | Yes     | No      | Yes (filter) |
| **Payment terms**                 | Yes (importable)   | Yes (built-in A/R) | N/A              | N/A                          | Via Stripe           | Yes (account terms) | Yes     | No      | No           |
| **Credit limits**                 | No                 | Yes                | No               | No                           | No                   | No                  | Yes     | No      | No           |

### Communication & Portal

| Feature                     | Printavo                   | ShopWorks                | InkSoft           | GraphicsFlow    | OMG             | DecoNetwork             | printIQ              | Kothari | Print Life       |
| --------------------------- | -------------------------- | ------------------------ | ----------------- | --------------- | --------------- | ----------------------- | -------------------- | ------- | ---------------- |
| **Built-in messaging**      | Yes                        | ProofStuff               | Order status      | Art comments    | Email templates | Notes + email           | Portal               | No      | Email            |
| **Customer portal**         | Public Profile + Merch     | ProofStuff + Pay         | Self-serve portal | Art Portal      | Order Hub       | Online stores + account | Portal + SmartSite   | No      | Basic portal     |
| **Artwork approval**        | Via portal                 | ProofStuff (digital sig) | Order approval    | Core feature    | Order Hub       | Artwork approvals       | Via portal           | No      | Auto-notify      |
| **Self-serve ordering**     | Merch stores               | ManageOrders             | Storefronts       | Design requests | Online Stores   | Online stores           | Portal ordering      | No      | Customer quoting |
| **Payment portal**          | Yes (stored billing)       | ShopWorks Pay            | InkSoft Payments  | No              | Stripe          | Store checkout          | Payment gateway      | No      | Email-based      |
| **Automated notifications** | Flexible automation engine | ProofStuff reminders     | Order status      | Approval alerts | Status updates  | Abandoned cart + status | Automated purchasing | No      | Production stage |

### Data Management

| Feature                | Printavo            | ShopWorks           | InkSoft       | GraphicsFlow      | OMG              | DecoNetwork             | printIQ             | Kothari       | Print Life             |
| ---------------------- | ------------------- | ------------------- | ------------- | ----------------- | ---------------- | ----------------------- | ------------------- | ------------- | ---------------------- |
| **Order history**      | Yes                 | Yes                 | Yes           | Art history       | Yes              | Yes                     | Yes                 | Job history   | Yes                    |
| **Communication logs** | Yes (activity feed) | Yes                 | Notes         | Approval timeline | Order-level      | Yes (History/Notes tab) | Yes                 | No            | Limited                |
| **Tags/segmentation**  | Order tags (#)      | Lead scoring        | Customer tags | Art tags          | Custom statuses  | Contract Price Levels   | Via CRM integration | No            | Tax-exempt filter only |
| **CSV import**         | Yes (template)      | Import wizard       | Via QBO       | No                | Upload data      | Yes (smart matching)    | API                 | No            | No                     |
| **CSV export**         | Yes                 | Yes                 | CRM report    | No                | Via integrations | Yes                     | API                 | No            | No                     |
| **QuickBooks sync**    | Yes (bidirectional) | No (built-in acct)  | Export only   | No                | Built-in acct    | Yes (one-way)           | Yes                 | No            | Yes                    |
| **Other integrations** | 1000+ via Zapier    | SAGE, Shopify, etc. | ShipStation   | Inktavo ecosystem | APIs, POD, ERP   | Xero, Zoho CRM, QBO     | Xero, HubSpot, Zoho | Printers only | S&S, SanMar            |

### Pricing & Terms

| Feature                       | Printavo           | ShopWorks         | InkSoft            | GraphicsFlow   | OMG         | DecoNetwork              | printIQ            | Kothari       | Print Life     |
| ----------------------------- | ------------------ | ----------------- | ------------------ | -------------- | ----------- | ------------------------ | ------------------ | ------------- | -------------- |
| **Customer-specific pricing** | Discount per order | Job-level pricing | Coupons/discounts  | N/A            | Quote-level | Contract Price Levels    | Pricing agreements | Ink cost calc | Price override |
| **Tiered pricing**            | Pricing matrix     | Included          | Quantity discounts | N/A            | No          | Volume + contract levels | Yes                | No            | Matrix-based   |
| **Internal notes**            | Production Notes   | Task alerts       | Contact notes      | Approval notes | Order notes | Internal notes + email   | Order notes        | No            | Basic          |
| **Customer-facing notes**     | Customer Notes     | ProofStuff        | Order status       | Comments       | Order Hub   | Notes via email + portal | Portal messages    | No            | Auto emails    |

---

## Key Insights for Mokumo

### What the Market Does Well (Table Stakes)

1. **Customer profiles with core fields**: Name, company, email, phone, address -- every competitor has this
2. **Order history per customer**: All platforms maintain order history
3. **Some form of customer portal**: 7 of 9 competitors offer customer-facing portals (Kothari and GraphicsFlow are exceptions due to different focus areas)
4. **QuickBooks integration**: The most common accounting integration across the industry
5. **Tax-exempt handling**: Most platforms support tax exemption at some level
6. **Notes system**: Both internal and customer-facing notes are standard

### What the Market Does Poorly (Our Opportunities)

1. **Customer-level tags and segmentation**: Most platforms have order-level tags but NOT customer-level tags. InkSoft is the exception with proper customer tags. This is an opportunity to build tags, groups, and custom fields at the customer level.
2. **Multi-contact management**: While supported, most platforms handle this poorly. Only OMG has role-based contacts (Orders/Art/Billing). This is a clear opportunity.
3. **Customer-specific pricing defaults**: Only DecoNetwork has sophisticated customer-tier pricing (Contract Price Levels). Most others handle discounts per-order only. Opportunity to set default pricing rules per customer.
4. **Smart CSV import**: Only DecoNetwork does smart record matching on import (by ID/email/login). Printavo duplicates records on import. Opportunity to build intelligent deduplication.
5. **Communication history**: While most platforms log communications, few present them in a unified timeline. Printavo's activity feed is closest, but it's order-centric, not customer-centric.
6. **Credit management**: Almost no platform handles credit limits or payment term enforcement. ShopWorks is the only one with real A/R management (built-in accounting). Opportunity to add credit limit warnings/enforcement.
7. **Custom fields**: Only DecoNetwork supports custom customer fields. Every shop has unique data they want to track (e.g., "shirt size for free samples", "preferred printer", "referred by"). Major opportunity.

### Standout Features to Consider

| Feature                                  | Source       | Relevance                                   |
| ---------------------------------------- | ------------ | ------------------------------------------- |
| Customer-stored billing (saved cards)    | Printavo     | High -- reduces payment friction            |
| Contract Price Levels (customer tiers)   | DecoNetwork  | High -- eliminates per-order discount entry |
| Role-based contacts (Orders/Art/Billing) | OMG          | High -- routes communications correctly     |
| Client vs. Prospect auto-classification  | InkSoft      | Medium -- automatic lead qualification      |
| Lead scoring and sales funnel            | ShopWorks    | Low for Phase 1, high for growth            |
| Custom customer fields                   | DecoNetwork  | High -- every shop has unique needs         |
| Smart CSV import with deduplication      | DecoNetwork  | High -- critical for migration              |
| Automated reorder reminders              | Printavo     | High -- drives repeat business              |
| Sales team assignment per company        | DecoNetwork  | Medium -- useful for multi-person shops     |
| Customer sales summary popup (hover)     | DecoNetwork  | Medium -- quick customer context            |
| Public Profile URL (no login)            | Printavo     | Medium -- frictionless customer access      |
| Art Approval event timeline              | GraphicsFlow | Medium -- audit trail for disputes          |

### Recommended Feature Prioritization for Mokumo

**CORE (Must Have)**:

1. Customer profile: name, company, email, phone, address (billing + shipping), tax-exempt status
2. Company/contact hierarchy with multiple contacts per company
3. Contact roles: Primary, Billing, Art/Design, Shipping
4. Customer notes: internal (shop-only) + customer-facing
5. Order history, quote history, payment history per customer
6. Search and filter: by name, company, status, tags
7. Tags: customer-level custom tags for segmentation
8. CSV import with smart deduplication (match by email)
9. CSV export of customer data
10. QuickBooks Online sync (customers, invoices, payments)

**PERIPHERAL (Should Have)**:

1. Payment terms per customer (Net 30, Due on Receipt, etc.)
2. Customer-specific default discount percentage
3. Custom fields (admin-defined, per customer)
4. Customer portal: view quotes, orders, approve artwork, make payments
5. Communication timeline (unified view of all interactions)
6. Tax settings per customer (rate override, exemption certificate reference)
7. Automated notifications at order status changes
8. Reorder suggestions based on past order patterns

**INTERCONNECTIONS**:

- Quoting: customer selected on quote; quote history visible on customer profile
- Invoicing: payment terms from customer profile auto-applied
- Artwork approval: art contacts notified; approval status on customer timeline
- Production: production notes reference customer preferences
- Reporting: customer value, order frequency, payment history reports

---

## Related Documents

- `docs/competitive-analysis/print-life-quoting-analysis.md` (Print Life quoting deep-dive)
- `docs/competitive-analysis/print-life-journey-quoting.md` (Print Life journey map)
- `docs/strategy/quoting-scope-definition.md` (Quoting scope)
- `.claude/plans/vertical-by-vertical-strategy.md` (Overall strategy)

---

## Sources

### Printavo

- [Printavo Official Site](https://www.printavo.com/)
- [Printavo Features](https://www.printavo.com/features/solutions/)
- [Printavo Support - Customers](https://support.printavo.com/hc/en-us/articles/1260805600530-Customers)
- [Printavo Support - Customer Public Profile](https://support.printavo.com/hc/en-us/articles/115004160567-Accessing-Customer-Public-Profile)
- [Printavo Support - Import Customer Data](https://support.printavo.com/hc/en-us/articles/115002343387-Import-Customer-Data)
- [Printavo Support - Using Tags](https://support.printavo.com/hc/en-us/articles/360003517754-Using-Tags)
- [Printavo Support - Nickname and Notes](https://support.printavo.com/hc/en-us/articles/360053635214-3-5a-Nickname-and-Notes)
- [Printavo Support - Customer-Stored Billing](https://support.printavo.com/hc/en-us/articles/19887557881883-Customer-Stored-Billing)
- [Printavo Support - Automations](https://support.printavo.com/hc/en-us/articles/1500001649682-Printavo-s-Automations-What-You-Need-To-Know)
- [Printavo Support - QuickBooks Export](https://support.printavo.com/hc/en-us/articles/115002342807-How-QuickBooks-Online-Export-Works)
- [Printavo Support - Fees, Discounts, and Tax Overrides](https://support.printavo.com/hc/en-us/articles/360053993114-3-8-Fees-Discounts-and-Tax-Overrides)
- [Printavo Support - Exporting Data](https://support.printavo.com/hc/en-us/articles/360056116174-6-7-Exporting-Data-for-Custom-Analysis)
- [Printavo Merch](https://www.printavo.com/merch/)
- [Printavo + InkSoft Integration](https://www.printavo.com/blog/integration-printavo-and-inksoft/)

### ShopWorks (OnSite)

- [ShopWorks Official Site](https://www.shopworx.com/)
- [ShopWorks OnSite ERP](https://www.shopworx.com/why-onsite/)
- [ShopWorks OnSite Business Management](https://www.shopworx.com/onsite-business-management-software/)
- [OnSite 8.3 & ProofStuff Release](https://www.shopworx.com/onsite-8-3-and-proofstuff-release/)
- [ProofStuff Online Proofing](https://www.shopworx.com/what-is-online-proofing-software-meet-shopworks-proofstuff/)
- [ShopWorks OnSite Reviews - SoftwareConnect](https://softwareconnect.com/reviews/shopworks-onsite/)
- [ShopWorks Avalara Integration](https://www.avalara.com/us/en/products/integrations/shopworks.html)
- [ShopWorks OnSite Reviews - Financesonline](https://reviews.financesonline.com/p/shopworks-onsite/)

### InkSoft

- [InkSoft Official Site](https://www.inksoft.com/)
- [InkSoft Manage Everything](https://www.inksoft.com/manage-everything/)
- [InkSoft Help - CRM](https://help.inksoft.com/hc/en-us/articles/9161041181211-Customer-Relationship-Management-CRM)
- [InkSoft Help - Contact Details](https://help.inksoft.com/hc/en-us/articles/9161160874139-Contact-Details)
- [InkSoft Customer Portal](https://www.inksoft.com/speed-up-simplify-the-reorder-process-with-the-inksoft-customer-portal/)
- [InkSoft Help - Pricing Options](https://help.inksoft.com/hc/en-us/articles/8389424465179-Pricing-Options)
- [InkSoft Help - Coupons & Discounts](https://help.inksoft.com/hc/en-us/articles/9270103311387-Coupons-Discounts)
- [InkSoft Feature Update - Order Approval Settings](https://www.inksoft.com/feature-update-require-order-approval-settings/)

### GraphicsFlow

- [GraphicsFlow Official Site](https://www.graphicsflow.com/)
- [GraphicsFlow Art Approval Updates](https://www.graphicsflow.com/art-approval-updates-enhanced-tracking-and-notifications/)
- [GraphicsFlow Art Portal](https://www.graphicsflow.com/meet-modern-customer-demands-with-graphicsflow-and-art-portal/)
- [GraphicsFlow Art Portal Organization](https://www.graphicsflow.com/get-organized-for-2022-with-graphicsflow-art-portal/)
- [GraphicsFlow Design Request Updates](https://www.graphicsflow.com/art-portal-and-design-request-updates/)

### OrderMyGear (OMG)

- [OrderMyGear Official Site](https://www.ordermygear.com/)
- [OMG Order Management](https://www.ordermygear.com/order-management/)
- [OMG Online Stores](https://www.ordermygear.com/online-stores/)
- [OMG Pricing](https://www.ordermygear.com/pricing/)
- [OMG Presentations](https://www.ordermygear.com/presentations/)

### DecoNetwork

- [DecoNetwork Official Site](https://www.deconetwork.com/)
- [DecoNetwork Customer Management Features](https://www.deconetwork.com/customer-management/features)
- [DecoNetwork Help - Customer Fields](https://help.deconetwork.com/hc/en-us/articles/235251588-Customer-Fields)
- [DecoNetwork Help - Add New Customer](https://help.deconetwork.com/hc/en-us/articles/219111377-Add-new-customer)
- [DecoNetwork Help - Edit Customer Account Details](https://help.deconetwork.com/hc/en-us/articles/360006462154-Edit-customer-account-details)
- [DecoNetwork Help - Import Customers](https://help.deconetwork.com/hc/en-us/articles/115002627108-Import-customers)
- [DecoNetwork Help - Companies List](https://help.deconetwork.com/hc/en-us/articles/25404174558107-Companies-List)
- [DecoNetwork Help - Contract Price Levels](https://help.deconetwork.com/hc/en-us/articles/360045936254-Contract-Price-Levels)
- [DecoNetwork Help - Send Note to Customer](https://help.deconetwork.com/hc/en-us/articles/218000487-Send-note-to-customer)
- [DecoNetwork Help - Internal Notes](https://help.deconetwork.com/hc/en-us/articles/218000637-Add-internal-note-to-quote-order)
- [DecoNetwork Help - Customer Account Activity](https://help.deconetwork.com/hc/en-us/articles/360007501694-View-a-Customer-s-Account-Activity)
- [DecoNetwork Help - QuickBooks Online Integration](https://help.deconetwork.com/hc/en-us/articles/230820827-Set-Up-and-Configure-QuickBooks-Online-QBO-Accounting-Integration-in-DecoNetwork)
- [DecoNetwork Help - Xero Integration](https://help.deconetwork.com/hc/en-us/articles/232060827-Accounting-Software-Integration-Xero)
- [DecoNetwork Help - Zoho CRM Integration](https://help.deconetwork.com/hc/en-us/articles/228143787-Zoho-CRM-Integration)
- [DecoNetwork vs Printavo](https://www.deconetwork.com/is-deconetwork-better-than-printavo/)
- [DecoNetwork vs InkSoft](https://www.deconetwork.com/deconetwork-vs-inksoft/)

### printIQ

- [printIQ Official Site](https://printiq.com/)
- [printIQ Enterprise](https://printiq.com/products/enterprise/)
- [printIQ Third-Party Integrations](https://printiq.com/third-party-software-integrations/)
- [printIQ MIS Spotlight - WhatTheyThink](https://whattheythink.com/articles/87803-printiq-mis-management-workflow-system/)
- [printIQ IQconnect API](https://printiq.com/iqconnect-api/)

### Kothari Print Pro

- [Kothari Info-Tech Products](https://www.kothariinfotech.com/products.html)
- [Kothari DTG Edition](https://www.kothariinfotech.com/dtg-edition.html)
- [Kothari Print Pro - LogoJET](https://www.logojet.com/pages/kothari-print-pro-rip-software-logojet-edition)

### Print Life

- [The Print Life Official Site](https://www.theprintlife.com/)
- [Print Life 2024 Update](https://www.theprintlife.com/the-print-life-screen-print-management-software-2024-update-is-live/)
- [Print Life Q1 2025 Updates](https://www.theprintlife.com/quarter-1-2025-print-life-updates/)
- [Print Life Welcome](https://www.theprintlife.com/welcome-to-the-print-life-screen-print-management-software/)

### General Industry

- [Top 6 CRMs for the Printing Industry - INSIDEA](https://insidea.com/blog/hubspot/crms-for-the-printing-industry/)
- [Top 8 Screen Printing Shop Management Software - DecoNetwork](https://www.deconetwork.com/top-8-screen-printing-shop-management-software-picks/)
- [Screen Printing Software Comparison - Teesom](https://teesom.com/inksoft-deconet-teesom/)
- [Best Screen Printing Software - Screen Print Direct](https://screenprintdirect.com/blogs/screen_printing_101/best-screen-printing-software-which-program-is-best)
