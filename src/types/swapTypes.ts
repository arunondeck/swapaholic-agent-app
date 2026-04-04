export interface SwapNamedEntity {
  id: string;
  name: string;
}

export interface SwapCategory extends SwapNamedEntity {
  code_c?: string;
  google_product_category_c?: string;
}

export type SwapTaxonomyOption = SwapNamedEntity;

export interface SwapBrandOption extends SwapNamedEntity {
  brand_segments?: {
    id?: string;
  };
}

export interface SwapTaxonomySelectProps {
  taxonomyName: string;
  options: SwapTaxonomyOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  searchable?: boolean;
}

export interface SwapColor extends SwapNamedEntity {
  code_c?: string;
}

export interface SwapStyle extends SwapNamedEntity {
  code_c?: string;
  status_c?: string;
  category_id_c?: string;
}

export interface SwapSize extends SwapNamedEntity {
  us_size_c?: string;
  standard_c?: string;
  type_c?: string;
}

export interface SwapCustomerInfo extends SwapNamedEntity {
  type_c?: string;
}

export interface SwapCollection extends SwapNamedEntity {
  tiled_collection_c?: string;
}

export interface SwapSubscribe extends SwapNamedEntity {
  unique_id_c?: string;
  subscribe_type_c?: string;
  sub_type_c?: string;
  type_c?: string;
  status_c?: string;
  description?: string;
  date_entered?: string;
  expiry_date_c?: string;
}

export interface SwapImage {
  id: string;
  name: string;
  type_c: string;
  unique_id_c: string;
  date_entered: string;
  sequence_no: number;
}

export interface SwapSubscriptionPlan extends SwapNamedEntity {
  validity_c?: string;
  number_of_items_c?: string;
  number_of_points_c?: string;
  price_c?: string;
  type_c?: string;
  sub_type_c?: string;
  status_c?: string;
  description?: string;
  discount_matrix_c?: Array<Record<string, unknown>>;
}

export interface SwapCustomerSubscribe extends SwapSubscribe {
  number_of_items_c?: string;
  number_of_points_c?: string;
  expiry_date_c?: string;
  number_of_accepted_items_c?: string;
  number_of_rejected_items_c?: string;
  items_swapped_c?: string;
  deliveries_done_c?: string;
  remaining_items_c?: string;
  subscription?: SwapSubscriptionPlan | null;
}

export interface SwapCustomerSubscribeCollection {
  subscribe: SwapCustomerSubscribe | null;
  shop_subscribe: SwapCustomerSubscribe | null;
  event_subscribe: SwapCustomerSubscribe | null;
}

export interface SwapCustomer extends SwapCustomerInfo {
  first_name_c?: string;
  last_name_c?: string;
  email_c?: string;
  gender_c?: string;
  date_of_birth_c?: string;
  profile_pic_c?: string;
  city_c?: string;
  state_c?: string;
  country_c?: string;
  mobile_c?: string;
  address_c?: string;
  status_c?: string;
  email_verified_c?: string;
  profile_verified_c?: string;
  profile_complete_c?: string;
  mobile_verified_c?: string;
  assigned_user_id?: string;
  stripe_customer_id_c?: string;
  username_type_c?: string;
  total_items_surrendered_c?: string;
  total_items_swapped_c?: string;
  total_available_points_c?: string;
  influencer_code_c?: string;
  password_c?: string;
  store_items_surrendered_c?: string;
  store_items_swapped_c?: string;
  store_available_points_c?: string;
  event_items_surrendered_c?: string;
  event_items_swapped_c?: string;
  event_available_points_c?: string;
  age_c?: string;
  auth_state_c?: string;
  sr_note_c?: string;
  subscribe?: SwapCustomerSubscribe | null;
  shop_subscribe?: SwapCustomerSubscribe | null;
  event_subscribe?: SwapCustomerSubscribe | null;
}

export type swapCustomer = SwapCustomer;
export type swapCustomerSubscribe = SwapCustomerSubscribe;

export interface SwapProduct {
  id: string;
  name: string;
  rubric_points_c: string;
  evaluated_points_c: string;
  markup_percentage_c: string;
  markdown_percentage_c: string;
  stage_c: string;
  new_with_tag_c?: string;
  status_c: string;
  sub_status_c: string;
  card_url_c?: string;
  photoshoot_c?: string;
  location_c: string;
  unique_item_id_c: string;
  bonus_points_c?: string;
  date_entered: string;
  thumbnail_c: string;
  thumbnail?: string;
  image?: string;
  front_chest_c?: string;
  back_chest_c?: string;
  front_waist_c?: string;
  back_waist_c?: string;
  front_hips_c?: string;
  back_hips_c?: string;
  length_c?: string;
  stretch_c?: string;
  available_c: string;
  garment_story_c?: string;
  store_ratings_c?: string;
  is_tpr_event_item_c?: string;
  images: SwapImage[];
  defect_area: Record<string, unknown> | null;
  cart: Record<string, unknown> | null;
  condition: Record<string, unknown> | null;
  brand: SwapNamedEntity;
  size: SwapSize;
  style: SwapStyle;
  color: SwapColor;
  user_segment: SwapNamedEntity & { code_c?: string };
  category: SwapCategory;
  customer: SwapCustomerInfo;
  pick_up: SwapNamedEntity;
  occasion?: SwapNamedEntity;
  made_in?: SwapNamedEntity;
  materials?: SwapNamedEntity[];
  policies?: SwapNamedEntity[];
  collections?: SwapCollection[];
  reserved?: boolean;
  product_number_c?: string;
  price?: string | number;
  points?: string | number;
}

export type swapProducts = SwapProduct;
export type swapSubscription = SwapSubscriptionPlan;

export interface SwapCustomerOrder {
  id: string;
  status: string;
  date: string;
  itemCount: string;
  total: string;
  paymentMethod?: string;
  email?: string;
}

export interface swapOrderType {
  id: string;
  name: string;
  unique_id_c: string;
  customer_id_c?: string;
  type_c: string;
  order_cost_c: string;
  total_items_c: string | number;
  order_date_c: string;
  points_id_c?: string;
  event_id_c?: string;
  event_customer_id_c?: string;
  subscribe_id_c?: string;
  customer_address_id_c?: string;
  status_c: string;
  sub_status_c: string;
  tracking_id_c: string;
  date_entered?: string;
  escalate_reason_c: string;
  subscribe?: Record<string, unknown>[] | Record<string, unknown> | null;
  customer: swapCustomer;
  order_line_items: swapProducts[];
}

export type SwapOrder = swapOrderType;

export interface SwapCustomerPickup {
  id: string;
  subscriptionId: string;
  date: string;
  address: string;
  totalItems: number;
  remainingItems: number;
  items: Array<Record<string, string>>;
}

export interface SwapProductReview {
  id: string;
  productId: string;
  action: 'approve' | 'reject';
  status: string;
  reviewedBy: string;
  reviewedAt: string;
  notes: string;
}

export interface SwapLoginResponse {
  token: string;
  customer: SwapCustomer;
  state_hash: null;
}

export interface swapPickup {
  id: string;
  name?: string;
  trip_date_c?: string;
  trip_time_c?: string;
  number_of_items_c?: string;
  extra_trip_c?: string;
  status_c?: string;
  unique_id_c?: string;
  street_address_c?: string;
  city_c?: string;
  country_c?: string;
  state_c?: string;
  postal_code_c?: string;
  apt_no_c?: string;
  building_name_c?: string;
  street_no_c?: string;
  street_name_c?: string;
  trip_id_c?: string;
  date_entered?: string;
  shop_visit_date_c?: string;
  shop_visit_time_c?: string;
  accepted_items_c?: string;
  rejected_items_c?: string;
  customer?: swapCustomer[];
  subscribe?: swapCustomerSubscribe[];
  customer_items?: swapProducts[];
  pickup_card?: SwapNamedEntity[];
  items_added?: string;
  subscriptionId: string;
  date: string;
  address: string;
  totalItems: number;
  remainingItems: number;
  items: swapProducts[];
}

export type SwapPickup = swapPickup;

export interface SwapSubscription {
  id: string;
  uniqueId?: string;
  plan: string;
  status: string;
  startDate: string;
  renewalDate: string;
  subscriptionType?: string;
  subscriptionSubType?: string;
  description?: string;
  numberOfPoints?: number;
  numberOfItems?: number;
  acceptedItems?: number;
  rejectedItems?: number;
  itemsSwapped?: number;
  deliveriesDone?: number;
  itemsRemaining: number;
  items: SwapProduct[];
}

export interface SwapReviewResponse {
  id: string;
  productId: string;
  action: 'approve' | 'reject';
  status: string;
  reviewedBy: string;
  reviewedAt: string;
  notes: string;
}

export type SwapSubscriptionTenancy =
  | 'SWAP.SUB.TYPE.ITEMS.STORE'
  | 'SWAP.SUB.TYPE.ITEMS.SHOP'
  | 'SWAP.SUB.TYPE.POINTS.SHOP'
  | 'SWAP.SUB.TYPE.CONVERSIONS.SHOP';

export interface SwapSubscribesRequest {
  customerId: string;
  subscribeType?: 'shop' | 'store' | 'event';
  ignoreNonPickupSubscribe?: boolean;
}

export interface SwapPickupItemsRequest {
  pickupId: string;
  maxResults?: number;
  offset?: number;
  filters?: Array<Record<string, unknown>>;
}

export interface SwapUnreviewedItemsRequest {
  maxResults?: number;
  offset?: number;
  filters?: Array<Record<string, unknown>>;
  customerEmail?: string;
  authToken?: string;
}

export interface SwapReviewItemRequest {
  id: string;
  status_c: 'approved' | 'callback' | 'donate';
  customerEmail?: string;
  authToken?: string;
}

export type SwapAssetFile = Blob | { uri: string; name?: string; type?: string };

export interface SwapAddItemRequest {
  pickupId: string;
  thumbnailFile: SwapAssetFile;
}

export interface SwapUpdateCustomerItemRequest {
  id: string;
  item: Record<string, unknown>;
}

export interface SwapCreateCustomerPickupItemRequest extends SwapAddItemRequest {
  item: Record<string, unknown>;
}

export interface SwapCheckoutCartItem {
  id?: string;
  sku: string;
  name: string;
  size: string;
  points: string;
}

export interface SwapOrderCreateItem {
  id: string;
  evaluated_points_c: string;
}

export type SwapCheckoutMode = 'customer' | 'nonCustomer';

export interface SwapCheckoutAuthContext {
  email: string;
  customerId: string;
  token: string;
}

export interface SwapPointsPurchaseResult {
  subscribeId: string;
  response: Record<string, unknown>;
}

export interface SwapOrderCreateRequest {
  subscribe_id_c: string;
  customer_address_id_c?: string;
  items: SwapOrderCreateItem[];
  customer_address?: string;
}

export interface SwapOrderCreateResponseData {
  order: SwapOrder;
  state_hash: null;
}

export interface SwapApiError {
  code: string;
  message: string;
  data: Record<string, unknown> | null;
}

export interface SwapApiSuccess<T> {
  code: string;
  message: string;
  data: T;
}

export interface SwapApiEnvelope<T> {
  status: boolean;
  success: SwapApiSuccess<T> | null;
  error: SwapApiError | null;
  status_code: number;
}

export interface SwapItemEntryOptions {
  categoryEntities?: SwapTaxonomyOption[];
  categoryOptions: Record<string, string[]>;
  conditionOptions: string[];
  brandOptions: SwapBrandOption[];
  userSegmentOptions: SwapTaxonomyOption[];
  colorOptions?: SwapColor[];
  styleOptions?: SwapStyle[];
  sizeOptions?: SwapSize[];
  materialOptions?: SwapTaxonomyOption[];
  madeInOptions?: SwapTaxonomyOption[];
  occasionOptions?: SwapTaxonomyOption[];
}
