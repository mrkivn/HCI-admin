# HCI Admin

This repository contains the admin-facing modules for the HCI Hotel & Restaurant Management project. It was split from the customer-facing repo `HCI`.

## Structure

- `index.html`: Admin portal landing page with links to modules
- `front-office/`: Front office dashboard
- `reservation/`: Reservation management
- `room-facilities/`: Room and facilities management
- `housekeeping/`: Housekeeping operations
- `kitchen/`: Kitchen operations and food orders
- `bar/`: Bar operations and drink orders
- `billing/`: Billing and invoicing
- `shared/`: Shared styles and JS utilities
- `firebase-config.js`, `firebase-db.js`, `init-security-check.js`: Firebase setup and security gates

## Getting Started

Open `index.html` in a modern browser. The admin modules are static HTML/JS and require your Firebase project configuration in `firebase-config.js`.

If you deploy, ensure hosting includes:

- `index.html`
- All module directories listed above
- `shared/` assets
- Firebase configuration files

## Develop

- Update navigation from `index.html` if you add/remove modules
- Keep shared styling in `shared/shared-styles.css`

## Security

The admin portal references `init-security-check.js` to guard pages. Ensure rules in `firestore.rules` are deployed to your Firebase project.

