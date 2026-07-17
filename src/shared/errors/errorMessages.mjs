// @ts-check

/** @type {Record<string, string>} */
export const errorMessages = {
  network: "We couldn't complete your request. Please check your connection and try again.",
  timeout: "The request took too long. Please try again.",
  400: "Some information is invalid. Please review the form and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to perform this action.",
  404: "The requested information could not be found.",
  409: "This action conflicts with existing data. Please review and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong. Please try again later.",
  generic: "Something went wrong. Please try again later.",
};

/** @type {Record<string, string>} */
export const businessErrorMessages = {
  SLOT_ALREADY_OCCUPIED: "This slot has already been assigned. Please refresh and try again.",
  SLOT_LIMIT_REACHED: "The slot limit has been reached for this market.",
  MARKET_LIMIT_REACHED: "You have reached the maximum number of markets for your current plan.",
  MARKET_PACKAGE_REQUIRED: "Your current plan does not include this feature.",
  BOOTH_PACKAGE_REQUIRED: "Your current plan does not include this feature.",
  PAYMENT_EVIDENCE_REQUIRED: "Payment evidence is required to complete this request.",
  INVALID_MARKET_PACKAGE_PRICE: "The selected package price is invalid.",
  REGISTRATION_ALREADY_PROCESSED: "This registration has already been processed.",
  COMPLAINT_ALREADY_PROCESSED: "This complaint has already been processed.",
  INVALID_DATE_RANGE: "The end date must be later than the start date.",
  USER_STATUS_CONFLICT: "This account status conflicts with the current action.",
  PACKAGE_CODE_CONFLICT: "This package code already exists.",
  PROMOTION_NOT_ALLOWED: "Your current plan does not include promotions.",
  FEATURED_BOOTH_NOT_ALLOWED: "This booth cannot be featured with its current subscription.",
  FEATURED_FOOD_NOT_ALLOWED: "This item cannot be featured with your current subscription.",
  FOOD_TAG_CODE_CONFLICT: "This food tag code already exists.",
  BAD_REQUEST: "Some information is invalid. Please review the form and try again.",
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: "The requested information could not be found.",
  CONFLICT: "This action conflicts with existing data. Please review and try again.",
  DATABASE_CONFLICT: "This action conflicts with existing data. Please review and try again.",
  INTERNAL_SERVER_ERROR: "Something went wrong. Please try again later.",
  APP_ERROR: "Something went wrong. Please try again later.",
  MENU_ITEM_LIMIT_REACHED: "You have reached the menu item limit for your current plan.",
  REVIEW_REPLY_NOT_ALLOWED: "Your current plan does not include review replies.",
  ANALYTICS_NOT_ALLOWED: "Analytics are not available for your current plan.",
  INVALID_CREDENTIALS: "Incorrect email or password. Please try again.",
};
