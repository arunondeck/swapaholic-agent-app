import { buildBoothProductCode } from '../utils/boothProductCode';
import { getCachedStoredAppSession, getStoredAppToken } from '../store/appSessionStorage';

const BOOTH_GRAPHQL_URL = process.env.EXPO_PUBLIC_BOOTH_GRAPHQL_URL || '';
const BOOTH_USE_MOCK = (process.env.EXPO_PUBLIC_BOOTH_USE_MOCK || process.env.EXPO_PUBLIC_SWAP_USE_MOCK || 'true').toLowerCase() === 'true';

const LOGIN_MUTATION = `
mutation Login($input: UsersPermissionsLoginRegisterInput!) {
  mktRegisterLogin(input: $input) {
    user {
      id
      username
      email
      confirmed
      blocked
      user {
        id
        username
        email
        confirmed
        blocked
        seller_enabled
        first_name
        last_name
      }
    }
    token
  }
}`;

const SELLER_BOOTH_LIST_FRAGMENT = `
fragment SellerBoothList on SellerBooth {
  id
  user {
    id
    username
    first_name
    last_name
    seller_enabled
  }
  name
  business_name
  is_verified
  is_inactive
  created_at
  booth_products {
    id
    name
    friendly_product_id
    listing_price
    stock_quantity
    original_stock
    manual_review_passed
    sold
    returned_to_seller
  }
  booth_start_date
  booth_end_date
  booth_slot
}`;

const BASIC_BOOTH_PRODUCT_FRAGMENT = `
fragment BasicBoothProduct on BoothProduct {
  id
  name
  friendly_product_id
  manual_review_passed
  images {
    id
    name
    url
  }
  category {
    id
    name
  }
  created_at
  listing_price
  original_price
  sold
  seller {
    id
  }
  seller_booth {
    id
    name
  }
  brand {
    id
    name
  }
  size_on_label
  returned_to_seller
  dev_booth_product_id
  stock_quantity
  original_stock
  description
  rejected
}`;

const GET_SELLER_BOOTHS_QUERY = `
${SELLER_BOOTH_LIST_FRAGMENT}
query GetSellerBooths($where: JSON, $start: Int, $limit: Int) {
  sellerBooths(where: $where, start: $start, limit: $limit, sort: "booth_start_date:desc") {
    ...SellerBoothList
  }
  sellerBoothsConnection(where: $where) {
    aggregate {
      count
    }
  }
}`;

const GET_BOOTH_PRODUCTS_QUERY = `
${BASIC_BOOTH_PRODUCT_FRAGMENT}
query SellerBoothProducts($where: JSON!) {
  boothProducts(where: $where) {
    ...BasicBoothProduct
  }
  boothProductsConnection(where: $where) {
    aggregate {
      count
    }
  }
}`;

const GET_BOOTH_PRODUCT_BY_ID_QUERY = `
${BASIC_BOOTH_PRODUCT_FRAGMENT}
query BoothProductById($id: ID!) {
  boothProducts(where: { id: $id }, limit: 1) {
    ...BasicBoothProduct
  }
}`;

const UPDATE_BOOTH_PRODUCT_MUTATION = `
${BASIC_BOOTH_PRODUCT_FRAGMENT}
mutation UpdateBoothProduct($input: updateBoothProductInput) {
  updateBoothProduct(input: $input) {
    boothProduct {
      ...BasicBoothProduct
    }
  }
}`;

const UPDATE_BOOTH_MUTATION = `
${SELLER_BOOTH_LIST_FRAGMENT}
mutation UpdateBooth($input: updateSellerBoothInput) {
  updateSellerBooth(input: $input) {
    sellerBooth {
      ...SellerBoothList
    }
  }
}`;

const BOOTH_PRODUCT_STATUS_COUNTS_QUERY = `
query BoothProductStatusCounts(
  $totalWhere: JSON!
  $pendingWhere: JSON!
  $approvedWhere: JSON!
  $soldWhere: JSON!
  $rejectedWhere: JSON!
) {
  total: boothProductsConnection(where: $totalWhere) { aggregate { count } }
  pending: boothProductsConnection(where: $pendingWhere) { aggregate { count } }
  approved: boothProductsConnection(where: $approvedWhere) { aggregate { count } }
  sold: boothProductsConnection(where: $soldWhere) { aggregate { count } }
  rejected: boothProductsConnection(where: $rejectedWhere) { aggregate { count } }
}`;

const GET_BOOTH_PAYMENT_METHODS_QUERY = `
query GetBoothPaymentMethods {
  boothPaymentMethods {
    id
    method
  }
}`;

const CREATE_BOOTH_CHECKOUT_MUTATION = `
mutation CreateBoothCheckout($input: createBoothCheckoutInput) {
  createBoothCheckout(input: $input) {
    boothCheckout {
      id
      Cart_value
      Booth_payment_method {
        id
        method
      }
      created_at
      checkout_date
    }
  }
}`;

const MARK_PRODUCT_SALE_MUTATION = `
mutation MarkProductSale($input: BoothProductSaleInput!) {
  markProductSale(input: $input) {
    saleStatus
    saleStatusMessage
    boothProduct {
      id
      name
      sold
      stock_quantity
    }
  }
}`;

const GET_ALL_BOOTH_CHECKOUTS_QUERY = `
query GetAllBoothCheckouts($limit: Int, $start: Int, $sort: String, $where: JSON) {
  boothCheckouts(limit: $limit, start: $start, sort: $sort, where: $where) {
    id
    Cart_value
    items {
      quantity
    }
    created_at
    checkout_date
    Booth_payment_method {
      id
      method
    }
  }
  boothCheckoutsConnection(where: $where) {
    aggregate {
      count
    }
  }
  boothCheckoutsAggregateStats(where: $where) {
    total_cart_value
    total_items_sold
    total_checkouts
  }
}`;

const GET_BOOTH_CHECKOUT_QUERY = `
query GetBoothCheckout($id: ID!) {
  boothCheckout(id: $id) {
    id
    Cart_value
    Booth_payment_method {
      id
      method
    }
    items {
      booth_product {
        id
        name
        images {
          url
        }
        listing_price
        friendly_product_id
        seller_booth {
          id
          name
        }
        seller {
          id
        }
        brand {
          id
          name
        }
      }
      quantity
    }
    created_at
    checkout_date
  }
}`;

const formatBoothProduct = (product) => ({
  ...product,
  code: buildBoothProductCode(product),
  brand: product.brand?.name || '',
  size: product.size_on_label || '',
  price: `$${Number(product.listing_price || 0).toFixed(2)}`,
});

const requestBoothGraphql = async (query, variables = {}, { requiresAuth = true } = {}) => {
  if (!BOOTH_GRAPHQL_URL) {
    throw new Error('EXPO_PUBLIC_BOOTH_GRAPHQL_URL is required in .env when EXPO_PUBLIC_BOOTH_USE_MOCK is false.');
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = getCachedStoredAppSession()?.token || (await getStoredAppToken());
    if (!token) {
      throw new Error('Booth sign-in required.');
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(BOOTH_GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Booth GraphQL request failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || 'Booth GraphQL request failed.');
  }

  return payload.data;
};

export const boothGraphqlConfig = {
  url: BOOTH_GRAPHQL_URL,
  useMock: BOOTH_USE_MOCK,
};

export const isBoothLiveEnabled = () => !BOOTH_USE_MOCK;

export const boothLogin = async (email, password) => {
  const data = await requestBoothGraphql(
    LOGIN_MUTATION,
    {
      input: {
        email,
        password,
        provider: 'local',
        type: 'login',
      },
    },
    { requiresAuth: false }
  );

  const result = data?.mktRegisterLogin;
  if (!result?.token) {
    throw new Error('Login failed: no token received.');
  }

  return {
    token: result.token,
    user: result.user?.user || result.user || null,
  };
};

export const fetchSellerBooths = async ({ where = {}, start = 0, limit = 50 } = {}) => {
  const data = await requestBoothGraphql(GET_SELLER_BOOTHS_QUERY, { where, start, limit });
  return {
    booths: data?.sellerBooths || [],
    totalCount: data?.sellerBoothsConnection?.aggregate?.count || 0,
  };
};

export const fetchBoothProducts = async (where) => {
  const data = await requestBoothGraphql(GET_BOOTH_PRODUCTS_QUERY, { where });
  return {
    products: (data?.boothProducts || []).map(formatBoothProduct),
    totalCount: data?.boothProductsConnection?.aggregate?.count || 0,
  };
};

export const fetchBoothProductStatusCounts = async (boothId) => {
  const base = { seller_booth: boothId };
  const data = await requestBoothGraphql(BOOTH_PRODUCT_STATUS_COUNTS_QUERY, {
    totalWhere: base,
    pendingWhere: { ...base, manual_review_passed: false, rejected: false, returned_to_seller: false, sold: false },
    approvedWhere: { ...base, manual_review_passed: true, rejected: false, returned_to_seller: false, sold: false },
    soldWhere: { ...base, sold: true },
    rejectedWhere: { ...base, rejected: true },
  });

  return {
    total: data?.total?.aggregate?.count || 0,
    pending: data?.pending?.aggregate?.count || 0,
    approved: data?.approved?.aggregate?.count || 0,
    sold: data?.sold?.aggregate?.count || 0,
    rejected: data?.rejected?.aggregate?.count || 0,
  };
};

export const fetchBoothProductById = async (id) => {
  const data = await requestBoothGraphql(GET_BOOTH_PRODUCT_BY_ID_QUERY, { id });
  const product = data?.boothProducts?.[0] || null;
  return product ? formatBoothProduct(product) : null;
};

export const mutateBoothProduct = async (id, updates) => {
  const data = await requestBoothGraphql(UPDATE_BOOTH_PRODUCT_MUTATION, {
    input: {
      where: { id },
      data: updates,
    },
  });

  const product = data?.updateBoothProduct?.boothProduct || null;
  return product ? formatBoothProduct(product) : null;
};

export const mutateBooth = async (id, updates) => {
  const data = await requestBoothGraphql(UPDATE_BOOTH_MUTATION, {
    input: {
      where: { id },
      data: updates,
    },
  });

  return data?.updateSellerBooth?.sellerBooth || null;
};

export const fetchBoothPaymentMethods = async () => {
  const data = await requestBoothGraphql(GET_BOOTH_PAYMENT_METHODS_QUERY);
  return data?.boothPaymentMethods || [];
};

export const createLiveBoothCheckout = async (checkoutData) => {
  const data = await requestBoothGraphql(CREATE_BOOTH_CHECKOUT_MUTATION, {
    input: {
      data: checkoutData,
    },
  });

  return data?.createBoothCheckout?.boothCheckout || null;
};

export const markLiveProductSale = async (id, quantity) => {
  const data = await requestBoothGraphql(MARK_PRODUCT_SALE_MUTATION, {
    input: {
      where: { id },
      data: { quantity },
    },
  });

  return data?.markProductSale || null;
};

export const fetchAllBoothCheckouts = async ({ start = 0, limit = 50, sort = 'checkout_date:desc', where } = {}) => {
  const data = await requestBoothGraphql(GET_ALL_BOOTH_CHECKOUTS_QUERY, { start, limit, sort, where });
  return {
    checkouts: data?.boothCheckouts || [],
    totalCount: data?.boothCheckoutsConnection?.aggregate?.count || 0,
    aggregates: {
      totalCartValue: data?.boothCheckoutsAggregateStats?.total_cart_value || 0,
      totalItemsSold: data?.boothCheckoutsAggregateStats?.total_items_sold || 0,
      totalCheckouts: data?.boothCheckoutsAggregateStats?.total_checkouts || 0,
    },
  };
};

export const fetchBoothCheckout = async (id) => {
  const data = await requestBoothGraphql(GET_BOOTH_CHECKOUT_QUERY, { id });
  const checkout = data?.boothCheckout || null;
  if (!checkout) {
    return { checkout: null };
  }

  return {
    checkout: {
      ...checkout,
      items: (checkout.items || []).map((item) => ({
        ...item,
        booth_product: item?.booth_product ? formatBoothProduct(item.booth_product) : null,
      })),
    },
  };
};
