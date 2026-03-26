/**
 * Centralized JSDoc type declarations for booth-domain data.
 */

/**
 * @typedef {Object} BoothNamedEntity
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} BoothUser
 * @property {string} id
 * @property {string} [username]
 * @property {string} [first_name]
 * @property {string} [last_name]
 * @property {boolean} [seller_enabled]
 */

/**
 * @typedef {Object} BoothImage
 * @property {string} id
 * @property {string} name
 * @property {string} [url]
 */

/**
 * @typedef {Object} BoothProduct
 * @property {string} id
 * @property {string} name
 * @property {string} [friendly_product_id]
 * @property {boolean} [manual_review_passed]
 * @property {BoothImage[]} [images]
 * @property {BoothNamedEntity | null} [category]
 * @property {string} [created_at]
 * @property {number | string} [listing_price]
 * @property {number | string} [original_price]
 * @property {boolean} [sold]
 * @property {{ id: string } | null} [seller]
 * @property {{ id: string, name: string } | null} [seller_booth]
 * @property {BoothNamedEntity | string | null} [brand]
 * @property {string} [size_on_label]
 * @property {boolean} [returned_to_seller]
 * @property {string} [dev_booth_product_id]
 * @property {number} [stock_quantity]
 * @property {number} [original_stock]
 * @property {string} [description]
 * @property {boolean} [rejected]
 * @property {string} [code]
 * @property {string} [size]
 * @property {string} [price]
 */

/**
 * @typedef {Object} BoothPaymentMethod
 * @property {string} id
 * @property {string} method
 */

/**
 * @typedef {Object} BoothCheckoutItem
 * @property {number} quantity
 * @property {BoothProduct | null} booth_product
 */

/**
 * @typedef {Object} BoothCheckout
 * @property {string} id
 * @property {number} Cart_value
 * @property {string} created_at
 * @property {string} checkout_date
 * @property {BoothPaymentMethod | null} Booth_payment_method
 * @property {BoothCheckoutItem[]} items
 */

/**
 * @typedef {Object} SellerBooth
 * @property {string} id
 * @property {string} name
 * @property {string} [business_name]
 * @property {BoothUser | null} [user]
 * @property {boolean} [is_verified]
 * @property {boolean} [is_inactive]
 * @property {string} [created_at]
 * @property {BoothProduct[]} [booth_products]
 * @property {string} [booth_start_date]
 * @property {string} [booth_end_date]
 * @property {string} [booth_slot]
 * @property {string} [seller]
 * @property {number} [items]
 * @property {'pending' | 'approved' | 'inactive'} [status]
 * @property {'current' | 'next' | 'upcoming' | 'done'} [cycle]
 */

/**
 * @typedef {Object} BoothCheckoutAggregates
 * @property {number} totalCartValue
 * @property {number} totalItemsSold
 * @property {number} totalCheckouts
 */

export {};
