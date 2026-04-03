# Swap Ops API integration

This module supports both **live API** and **mock mode**.

## Environment variables

Set these in Expo environment (`.env`, EAS env, or shell):

- `EXPO_PUBLIC_SWAP_API_URL` - base URL, example: `https://api.example.com`
- `EXPO_PUBLIC_SWAP_WALLET_API_URL` - wallet API base URL
- `EXPO_PUBLIC_SWAP_API_VERSION` - version segment, example: `v3`
- `EXPO_PUBLIC_SWAP_USE_MOCK` - `true` or `false`
- `EXPO_PUBLIC_BOOTH_GRAPHQL_URL` - booth GraphQL endpoint
- `EXPO_PUBLIC_BOOTH_USE_MOCK` - `true` or `false`
- `EXPO_PUBLIC_APP_NAME` - full app display name
- `EXPO_PUBLIC_BOOTH_LOGO_URL` - login screen logo image URL

When `EXPO_PUBLIC_SWAP_USE_MOCK=true`, all supported API methods return local mock responses.

---

## APIs implemented

### 1) Login as customer
- Function: `loginAsCustomer(email)`
- Endpoint: `POST /{api_ver}/yHncKdVLF2/customers/mime/login/email/3BCB2`
- Body:
```json
{
  "email_c": "ysnteo@gmail.com"
}
```
- Use returned `customer.id` for customer subscribe APIs.

### 2) Get subscriptions list
- Function: `getSubscriptionsList(tenancy)`
- Endpoint: `POST /{api_ver}/subscriptions/list`
- Supported tenancies:
  - `SWAP.SUB.TYPE.ITEMS.STORE`
  - `SWAP.SUB.TYPE.POINTS.SHOP`
  - `SWAP.SUB.TYPE.CONVERSIONS.SHOP`

### 2.1) Get all subscriptions
- Function: `getAllSubscriptions()`
- Behavior: calls all 3 tenancy variants above and returns a merged unique list by `id`.

### 3) Get customer subscribes list
- Function: `getCustomerSubscribesList({ customerId, subscribeType, ignoreNonPickupSubscribe })`
- Endpoint: `POST /{api_ver}/subscribes/list`
- Body shape:
```json
{
  "tenancy": "SWAP.SUBSCRIBE.GET.CUST_ID",
  "customer_id_c": "<customer-id-from-login>",
  "subscribe_type_c": "shop",
  "ignore_non_pickup_subscribe": false
}
```

### 3.1) Get active customer subscriptions
- Function: `getActiveCustomerSubscriptions(email)`
- Behavior: authenticates by email, calls customer subscribes list, and returns only active subscriptions.

### 3.2) Get all customer pickups
- Function: `getAllCustomerPickups(email)`
- Endpoint: `POST /{api_ver}/users/pickups/list`
- Body:
```json
{
  "status_c": "processing",
  "filter_tenancy": "SWAP.PICKUP.FILTER.CUSTOMER_EMAIL",
  "customer_email": "<customer-email>",
  "sent_to_logistics": "no",
  "sort_tenancy": "SWAP.PICKUP.SORT.DATE_ENTERED",
  "sort_type": "SWAP.PICKUP.SORT_TYPE.DESC",
  "max_results": 20,
  "offset": 0,
  "data_mode": ""
}
```

### 3.3) Get active package details
- Function: `getActivePackageDetails(email)`
- Behavior: fetches active customer subscriptions and resolves full details/items for the first active package via subscription details API.

### 3.4) Get customer subscription details
- Function: `getCustomerSubscriptionDetails(email, subscriptionId)`
- Endpoint: `POST /{api_ver}/subscribes/get`
- Body:
```json
{
  "tenancy": "SWAP.SUBSCRIBE.GET.BY_ID",
  "customer_id_c": "<customer-id-from-login>",
  "subscribe_id_c": "<subscription-id>",
  "fetch_items": true
}
```

### 4) Get customer details
- Function: `getCustomerDetails()`
- Endpoint: `POST /{api_ver}/customers/get`
- Includes subscription-related flags and wallet/subscribes list options.

### 5) Get items in pickup
- Function: `getItemsByPickup({ pickupId, maxResults, offset, filters })`
- Endpoint: `POST /v3/users/customer-items/list/by/pickup`

### 6) Get customer unreviewed items
- Function: `getCustomerUnreviewedItems({ maxResults, offset, filters })`
- Endpoint: `POST /{api_ver}/customer-items/list`

### 7) Add item to customer pickup
- Function: `addItemToCustomerPickup({ pickupId, thumbnailFile })`
- Endpoint: `POST /v3/users/customer-items/init`
- Uses `multipart/form-data` with:
  - `pickup_id_c`
  - `thumbnail_c`

### 8) Create swap order
- Function: `createSwapOrder(orderData)`
- Endpoint: `POST /{api_ver}/orders/init`
- Body:
```json
{
  "subscribe_id_c": "<subscription-id>",
  "customer_address_id_c": "",
  "items": [
    {
      "id": "<customer-item-id>",
      "evaluated_points_c": "4"
    }
  ],
  "customer_address": "."
}
```
- Response envelope:
```json
{
  "status": true,
  "success": {
    "code": "ORD-201",
    "message": "Order created",
    "data": {
      "order": {},
      "state_hash": null
    }
  },
  "error": null,
  "status_code": 200
}
```
- Error envelope:
```json
{
  "status": false,
  "success": null,
  "error": {
    "code": "ORD-009",
    "message": "Something went wrong",
    "data": {
      "state_hash": null
    }
  },
  "status_code": 200
}
```

### 9) Get styles taxonomy
- Function: `getStyles()`
- Endpoint: `POST /{api_ver}/users/styles/list`
- Auth: app user token
- Body:
```json
{
  "max_results": 45,
  "offset": 0,
  "order_by": "name ASC"
}
```

---

## Notes

- `swapApiConfig` export is available for diagnostics (`url`, `version`, `useMock`).
- Existing local helper APIs (`getCustomerOrders`, `getCustomerPickups`, etc.) remain available for current screens.
