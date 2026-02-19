# Fixing Crypto Wallet Routing

## Status: ✅ Analyzed & Fixed

### Issue
The user reported a 404 error when clicking on the Crypto Wallet card on the Home page.

### Analysis
- **Route Definitions (`src/App.tsx`)**:
  - `/crypto-wallet` -> Main list
  - `/crypto-wallet/add` -> Add wallet
  - `/crypto-wallet/:id` -> Details

- **Broken Links**:
  - `src/components/home/CryptoSummary.tsx` was pointing to `/crypto` and `/crypto/:id`.
  - `src/components/BottomNav.tsx` was pointing to `/crypto` in the "More" menu and checking for `/crypto` path for FAB action.

### Fixes Implemented
1.  **`src/components/home/CryptoSummary.tsx`**:
    - Replaced `navigate("/crypto")` with `navigate("/crypto-wallet")`.
    - Replaced `navigate(\`/crypto/${wallet.id}\`)` with `navigate(\`/crypto-wallet/${wallet.id}\`)`.

2.  **`src/components/BottomNav.tsx`**:
    - Updated "Carteira Cripto" menu item path to `/crypto-wallet`.
    - Updated FAB logic to check for `location.pathname.startsWith("/crypto-wallet")` and navigate to `/crypto-wallet/add`.

### Verification
- Clicking "Ver todas" on the Home page crypto card should now correctly navigate to `/crypto-wallet`.
- Clicking on a specific wallet card on the Home page should navigate to `/crypto-wallet/[ID]`.
- The "Carteira Cripto" option in the bottom navigation "Mais" menu should work.
- The FAB (+) button on the `/crypto-wallet` page should correctly redirect to `/crypto-wallet/add`.
