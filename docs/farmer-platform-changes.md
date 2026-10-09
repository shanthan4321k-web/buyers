# Farmer-Side Platform Enhancement Specification

This document specifies the exact requirements, shared database touchpoints, and UX enhancements for the **farmer-facing platform team**.

---

## 1. Overview & Objective

To integrate the existing farmer-facing application with the shared marketplace:
1. Ensure farmers complete their personal and farm profile before publishing selling listings.
2. Enable 1-click creation of **Selling Lots** (`selling_lots`) derived directly from existing saved `crop_cycles` and `plots` without redundant data re-entry.
3. Allow farmers to view incoming buyer offers, send counteroffers, accept offers to generate agreed orders, and track order fulfillment.
4. Allow farmers to discover active buying requirements (`buying_requirements`) matching their crops.

---

## 2. Farmer Experience Workflow

```
┌─────────────────────────┐
│ Farmer Signs In         │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐     Profile Incomplete
│ Profile Completion Check├────────────────────────► Redirect to /complete-profile
└───────────┬─────────────┘
            ▼ Complete
┌─────────────────────────┐
│ Farmer Dashboard        │ (Shows Farm, Plots & Crop Cycles)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Select Crop Cycle       │ (Auto-fills Crop Name, Variety, Harvest Date, Est. Yield)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Create Selling Lot      │ - Specify Selling Quantity (partial or full yield)
│                         │ - Set Asking Price OR toggle "Open to Offers"
│                         │ - Set Availability Date & Quality Details
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Publish to Shared DB    │ ──► Lot appears instantly on AgriGuide Buyer Marketplace
└─────────────────────────┘
```

---

## 3. Required Farmer-Side Enhancements

### 3.1 Profile-First Enforcement
- **Rule**: If a farmer's `full_name`, `phone_number`, `state`, or `district` is missing in `farmers`, block listing publishing and prompt profile completion.
- **Privacy Rule**: Farmer exact coordinates, bank details, and personal phone numbers must remain protected; only `full_name`, `district`, `state`, and `is_verified` are exposed to public marketplace buyers until an offer is formally accepted.

### 3.2 Crop-Cycle to Selling Lot Conversion
- When creating a selling lot, present an option: **"List from existing Crop Cycle"**.
- Selecting an active crop cycle auto-populates:
  - `crop_name`
  - `variety`
  - Default unit (e.g., `quintal`)
  - Suggested available quantity (based on estimated yield minus already listed quantities).
- Farmer confirms:
  - Actual quantity ready for sale.
  - Asking price per unit (or "Open to offers").
  - Approximate location (Town/District).
  - Expected harvest / availability date.

### 3.3 Offer & Negotiation Center
Farmers need an interface to:
1. **View Incoming Buyer Offers**:
   - Query `offers` where `farmer_id = auth.uid()` and `status = 'PENDING'`.
   - View buyer's business name, buyer type, proposed quantity, proposed price per unit, delivery preference, and payment terms.
2. **Respond to Offers**:
   - **Accept**: Changes `offers.status = 'ACCEPTED'`. Inserts a record into `orders`. Automatically deducts `agreed_quantity` from `selling_lots.available_quantity`.
   - **Counter**: Changes `offers.status = 'COUNTERED'`, sets `counter_price_per_unit`, `counter_quantity`, and `counter_notes`.
   - **Reject**: Changes `offers.status = 'REJECTED'`.

### 3.4 Order & Delivery Tracking
- Query `orders` where `farmer_id = auth.uid()`.
- Display agreed price, agreed quantity, total amount, delivery terms, and payment terms.
- Action to update `weighing_status` (e.g. `CONFIRMED_AT_FARM`) and `order_status` (`IN_TRANSIT`, `DELIVERED`).

---

## 4. Shared API & Table Reference for Farmer Team

| Operation | Target Supabase Table | Required Permissions |
|---|---|---|
| Create Selling Lot | `INSERT INTO selling_lots` | Authenticated farmer (`farmer_id = auth.uid()`) |
| View Offers | `SELECT FROM offers` | Farmer or Buyer party |
| Counter Offer | `UPDATE offers SET counter_price_per_unit, counter_notes, status = 'COUNTERED'` | Farmer (`farmer_id = auth.uid()`) |
| Accept Offer | `UPDATE offers SET status = 'ACCEPTED'`, `INSERT INTO orders` | Authorized party |
| View Orders | `SELECT FROM orders` | Farmer (`farmer_id = auth.uid()`) |
| Browse Buyer Demand | `SELECT FROM buying_requirements WHERE status = 'ACTIVE'` | Authenticated |
