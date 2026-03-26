/**
 * Centralized JSDoc type declarations for swap-domain data.
 */

/**
 * @typedef {Object} SwapNamedEntity
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {SwapNamedEntity & {code_c?: string, google_product_category_c?: string}} SwapCategory
 */

/**
 * @typedef {SwapNamedEntity & {code_c?: string}} SwapColor
 */

/**
 * @typedef {SwapNamedEntity & {code_c?: string}} SwapStyle
 */

/**
 * @typedef {SwapNamedEntity & {us_size_c?: string, standard_c?: string, type_c?: string}} SwapSize
 */

/**
 * @typedef {SwapNamedEntity & {type_c?: string}} SwapCustomerInfo
 */

/**
 * @typedef {SwapNamedEntity & {tiled_collection_c?: string}} SwapCollection
 */

/**
 * @typedef {SwapNamedEntity & {subscribe_type_c?: string, status_c?: string}} SwapSubscribe
 */

/**
 * @typedef {Object} SwapImage
 * @property {string} id
 * @property {string} name
 * @property {string} type_c
 * @property {string} unique_id_c
 * @property {string} date_entered
 * @property {number} sequence_no
 */

/**
 * @typedef {SwapNamedEntity & {
 *   validity_c?: string,
 *   number_of_items_c?: string,
 *   price_c?: string,
 *   type_c?: string,
 *   status_c?: string
 * }} SwapSubscriptionPlan
 */

/**
 * @typedef {SwapSubscribe & {
 *   number_of_items_c?: string,
 *   expiry_date_c?: string,
 *   number_of_accepted_items_c?: string,
 *   number_of_rejected_items_c?: string,
 *   items_swapped_c?: string,
 *   subscription?: SwapSubscriptionPlan | null
 * }} SwapCustomerSubscribe
 */

/**
 * @typedef {SwapCustomerInfo & {
 *   first_name_c?: string,
 *   last_name_c?: string,
 *   email_c?: string,
 *   gender_c?: string,
 *   date_of_birth_c?: string,
 *   profile_pic_c?: string,
 *   city_c?: string,
 *   state_c?: string,
 *   country_c?: string,
 *   mobile_c?: string,
 *   address_c?: string,
 *   status_c?: string,
 *   email_verified_c?: string,
 *   profile_verified_c?: string,
 *   profile_complete_c?: string,
 *   mobile_verified_c?: string,
 *   assigned_user_id?: string,
 *   stripe_customer_id_c?: string,
 *   username_type_c?: string,
 *   total_items_surrendered_c?: string,
 *   total_items_swapped_c?: string,
 *   total_available_points_c?: string,
 *   influencer_code_c?: string,
 *   password_c?: string,
 *   store_items_surrendered_c?: string,
 *   store_items_swapped_c?: string,
 *   store_available_points_c?: string,
 *   event_items_surrendered_c?: string,
 *   event_items_swapped_c?: string,
 *   event_available_points_c?: string,
 *   age_c?: string,
 *   auth_state_c?: string,
 *   sr_note_c?: string,
 *   subscribe?: SwapCustomerSubscribe | null,
 *   shop_subscribe?: SwapCustomerSubscribe | null,
 *   event_subscribe?: SwapCustomerSubscribe | null
 * }} SwapCustomer
 */

/**
 * @typedef {Object} SwapProduct
 * @property {string} id
 * @property {string} name
 * @property {string} rubric_points_c
 * @property {string} evaluated_points_c
 * @property {string} markup_percentage_c
 * @property {string} markdown_percentage_c
 * @property {string} stage_c
 * @property {string} [new_with_tag_c]
 * @property {string} status_c
 * @property {string} sub_status_c
 * @property {string} [card_url_c]
 * @property {string} [photoshoot_c]
 * @property {string} location_c
 * @property {string} unique_item_id_c
 * @property {string} [bonus_points_c]
 * @property {string} date_entered
 * @property {string} thumbnail_c
 * @property {string} [front_chest_c]
 * @property {string} [back_chest_c]
 * @property {string} [front_waist_c]
 * @property {string} [back_waist_c]
 * @property {string} [front_hips_c]
 * @property {string} [back_hips_c]
 * @property {string} [length_c]
 * @property {string} [stretch_c]
 * @property {string} available_c
 * @property {string} [garment_story_c]
 * @property {string} [store_ratings_c]
 * @property {string} [is_tpr_event_item_c]
 * @property {SwapImage[]} images
 * @property {null | Record<string, unknown>} defect_area
 * @property {null | Record<string, unknown>} cart
 * @property {null | Record<string, unknown>} condition
 * @property {SwapNamedEntity} brand
 * @property {SwapSize} size
 * @property {SwapStyle} style
 * @property {SwapColor} color
 * @property {SwapNamedEntity & {code_c?: string}} user_segment
 * @property {SwapCategory} category
 * @property {SwapCustomerInfo} customer
 * @property {SwapNamedEntity} pick_up
 * @property {SwapNamedEntity} [occasion]
 * @property {SwapNamedEntity} [made_in]
 * @property {SwapNamedEntity[]} [materials]
 * @property {SwapNamedEntity[]} [policies]
 * @property {SwapCollection[]} [collections]
 * @property {boolean} [reserved]
 * @property {string} [product_number_c]
 */

/**
 * @typedef {Object} SwapCustomerOrder
 * @property {string} id
 * @property {string} status
 * @property {string} date
 * @property {string} itemCount
 * @property {string} total
 * @property {string} [paymentMethod]
 * @property {string} [email]
 */

/**
 * @typedef {Object} SwapOrder
 * @property {string} id
 * @property {string} name
 * @property {string} unique_id_c
 * @property {string} type_c
 * @property {string} order_cost_c
 * @property {string} total_items_c
 * @property {string} order_date_c
 * @property {string} status_c
 * @property {string} sub_status_c
 * @property {string} tracking_id_c
 * @property {string} escalate_reason_c
 * @property {SwapCustomer} customer
 * @property {SwapProduct[]} order_line_items
 */

/**
 * @typedef {Object} SwapCustomerPickup
 * @property {string} id
 * @property {string} subscriptionId
 * @property {string} date
 * @property {string} address
 * @property {number} totalItems
 * @property {number} remainingItems
 * @property {Array<Record<string, string>>} items
 */

/**
 * @typedef {Object} SwapProductReview
 * @property {string} id
 * @property {string} productId
 * @property {'approve' | 'reject'} action
 * @property {string} status
 * @property {string} reviewedBy
 * @property {string} reviewedAt
 * @property {string} notes
 */

/**
 * @typedef {{ token: string, customer: SwapCustomer, state_hash: null }} SwapLoginResponse
 */

/**
 * @typedef {{ id: string, subscriptionId: string, date: string, address: string, totalItems: number, remainingItems: number, items: Array<Record<string, string>> }} SwapPickup
 */

/**
 * @typedef {{ id: string, plan: string, status: string, startDate: string, renewalDate: string, itemsRemaining: number, items: Array<Record<string, string>> }} SwapSubscription
 */

/**
 * @typedef {{ id: string, productId: string, action: 'approve' | 'reject', status: string, reviewedBy: string, reviewedAt: string, notes: string }} SwapReviewResponse
 */

/**
 * @typedef {'SWAP.SUB.TYPE.ITEMS.STORE' | 'SWAP.SUB.TYPE.POINTS.SHOP' | 'SWAP.SUB.TYPE.CONVERSIONS.SHOP'} SwapSubscriptionTenancy
 */

/**
 * @typedef {{ customerId: string, subscribeType?: 'shop' | 'store' | 'event', ignoreNonPickupSubscribe?: boolean }} SwapSubscribesRequest
 */

/**
 * @typedef {{ pickupId: string, maxResults?: number, offset?: number, filters?: Array<Record<string, unknown>> }} SwapPickupItemsRequest
 */

/**
 * @typedef {{ maxResults?: number, offset?: number, filters?: Array<Record<string, unknown>> }} SwapUnreviewedItemsRequest
 */

/**
 * @typedef {{ pickupId: string, thumbnailFile: Blob | { uri: string, name?: string, type?: string } }} SwapAddItemRequest
 */

/**
 * @typedef {{ id?: string, sku: string, name: string, size: string, points: string }} SwapCheckoutCartItem
 */

/**
 * @typedef {{ id: string, evaluated_points_c: string }} SwapOrderCreateItem
 */

/**
 * @typedef {{
 *   subscribe_id_c: string,
 *   customer_address_id_c?: string,
 *   items: SwapOrderCreateItem[],
 *   customer_address?: string
 * }} SwapOrderCreateRequest
 */

/**
 * @typedef {{ order: SwapOrder, state_hash: null }} SwapOrderCreateResponseData
 */

/**
 * @typedef {{ code: string, message: string, data: Record<string, unknown> | null }} SwapApiError
 */

/**
 * @template T
 * @typedef {{ code: string, message: string, data: T }} SwapApiSuccess
 */

/**
 * @template T
 * @typedef {{ status: boolean, success: SwapApiSuccess<T> | null, error: SwapApiError | null, status_code: number }} SwapApiEnvelope
 */

export {};
