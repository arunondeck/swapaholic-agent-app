# Swap Ops API integration

This module supports both **live API** and **mock mode**.

## Environment variables

Set these in Expo environment (`.env`, EAS env, or shell):

- `EXPO_PUBLIC_SWAP_API_URL` - base URL, example: `https://api.example.com`
- `EXPO_PUBLIC_SWAP_API_VERSION` - version segment, example: `v3`
- `EXPO_PUBLIC_SWAP_USE_MOCK` - `true` or `false`

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

---

## Notes

- `swapApiConfig` export is available for diagnostics (`url`, `version`, `useMock`).
- Existing local helper APIs (`getCustomerOrders`, `getCustomerPickups`, etc.) remain available for current screens.
