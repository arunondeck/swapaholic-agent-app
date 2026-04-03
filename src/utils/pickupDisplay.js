const toWholeNumber = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toCapitalizedWords = (value) =>
  String(value || '')
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

export const getPickupRemainingItems = (pickup) =>
  Math.max(
    0,
    toWholeNumber(
      pickup?.remainingItems,
      toWholeNumber(pickup?.remaining_items_c, toWholeNumber(pickup?.totalItems, toWholeNumber(pickup?.number_of_items_c)))
    )
  );

export const getPickupCreatedAtTimestamp = (pickup) => {
  const candidates = [
    pickup?.date_entered,
    pickup?.created_at,
    pickup?.createdAt,
    pickup?.date_created,
    pickup?.pickup_date_c,
    pickup?.trip_date_c,
    pickup?.date,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const parsed = new Date(candidate).getTime();
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return Number.NEGATIVE_INFINITY;
};

export const formatPickupDate = (pickup) => {
  const dateValue = String(pickup?.trip_date_c || pickup?.date || '').trim();
  const timestamp = new Date(dateValue).getTime();

  if (dateValue && !Number.isNaN(timestamp)) {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return dateValue || 'NA';
};

export const getPickupStatusDisplay = (pickup) => {
  const remainingItems = getPickupRemainingItems(pickup);
  const normalizedStatus = String(pickup?.status || pickup?.status_c || pickup?.sub_status_c || '')
    .trim()
    .toLowerCase();
  const derivedStatus = remainingItems === 0 ? 'Complete' : 'Incomplete';
  const isCompleted =
    normalizedStatus === 'complete' ||
    normalizedStatus === 'completed' ||
    normalizedStatus === 'delivered' ||
    (!normalizedStatus && remainingItems === 0);

  return {
    text: normalizedStatus ? toCapitalizedWords(normalizedStatus) : derivedStatus,
    isCompleted,
  };
};
