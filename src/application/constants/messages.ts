export const APP_MESSAGES = {
  // MSG-01
  REGISTER_SUCCESS_USER: "Registration successful. Please check your email to verify your account.",
  // MSG-02
  LOGIN_ERROR_CREDENTIALS: "Incorrect email or password. Please try again.",
  // MSG-03
  LOGIN_ERROR_UNVERIFIED: "Your account has not been verified. Please check your email.",
  // MSG-04
  LOGIN_ERROR_BANNED: "Your account has been banned. Please contact support for assistance.",
  // MSG-05
  PASSWORD_RECOVERY_SENT: "Password recovery instructions have been sent to your registered email.",
  // MSG-06
  PROFILE_UPDATED: "Your profile has been updated successfully.",
  // MSG-07
  BOOTH_REGISTRATION_SUBMITTED: "Your booth registration has been submitted for Administrator approval.",
  // MSG-08
  BOOTH_REGISTRATION_APPROVED: "Your booth registration has been approved.",
  // MSG-09
  BOOTH_REGISTRATION_REJECTED: (reason: string) => `Your booth registration has been rejected. Reason: ${reason}.`,
  // MSG-10
  BOOTH_INFO_UPDATED: "Booth information has been updated successfully.",
  // MSG-11
  BOOTH_DEACTIVATED: "The booth has been deactivated and cannot receive new orders.",
  // MSG-12
  FOOD_ITEM_CREATED: "The food item has been added to the booth menu.",
  // MSG-13
  FOOD_ITEM_UPDATED: "The food item has been updated successfully.",
  // MSG-14
  FOOD_ITEM_HIDDEN: "The food item has been hidden from the public menu.",
  // MSG-15
  FOOD_AVAILABILITY_UPDATED: "Food availability status has been updated successfully.",
  // MSG-16
  CART_ITEM_ADDED: "The food item has been added to your cart.",
  // MSG-17
  CART_ITEM_UNAVAILABLE: "This food item is currently unavailable and cannot be added to the cart.",
  // MSG-18
  PAYMENT_PROOF_SUBMITTED: "Payment proof has been submitted successfully.",
  // MSG-19
  ORDER_CREATED: (orderCode: string) => `Your order has been created successfully. Order code: ${orderCode}.`,
  // MSG-20
  ORDER_NEW_RECEIVED: (orderCode: string) => `A new order #${orderCode} has been received.`,
  // MSG-21
  ORDER_STATUS_UPDATED: (orderCode: string, status: string) => `Order #${orderCode} has been updated to ${status}.`,
  // MSG-22
  ORDER_STATUS_INVALID: "The selected order status update is not permitted.",
  // MSG-23
  REVIEW_SUBMITTED: "Your review and rating have been submitted successfully.",
  // MSG-24
  REVIEW_ELIGIBILITY_ERROR: "You can review this booth only after completing an eligible order.",
  // MSG-25
  REVIEW_UPDATED: "Your review has been updated successfully.",
  // MSG-26
  COMPLAINT_SUBMITTED: "Your complaint has been submitted successfully.",
  // MSG-27
  COMPLAINT_UPDATED: "The status or resolution of your complaint has been updated.",
  // MSG-28
  PROMOTION_APPLIED: (discount: string | number) => `The promotion has been applied successfully. Discount: ${discount} VND.`,
  // MSG-29
  PROMOTION_INVALID: "This promotion is invalid, inactive, expired, has reached its usage limit, or does not satisfy the order conditions.",
  // MSG-30
  SUBSCRIPTION_PURCHASED: "The subscription package has been purchased successfully.",
  // MSG-31
  SUBSCRIPTION_RENEWED: "The subscription package has been renewed successfully.",
  // MSG-32
  VALIDATION_REQUIRED: "This field is required.",
  // MSG-33
  VALIDATION_MAX_LENGTH: (max: number) => `Input exceeds the maximum allowed length of ${max} characters.`,
  // MSG-34
  VALIDATION_INVALID_EMAIL: "Please enter a valid email address.",
  // MSG-35
  VALIDATION_INVALID_PASSWORD: "The password must satisfy the configured security requirements.",
  // MSG-36
  SEARCH_NO_RESULTS: "No results were found. Please try a different keyword or search method.",
  // MSG-37
  FILE_SIZE_EXCEEDED: "The selected file exceeds the allowed size limit.",
  // MSG-38
  FILE_TYPE_UNSUPPORTED: "The selected file type is not supported.",
  // MSG-39
  ACCESS_DENIED: "You do not have permission to perform this action.",
  // MSG-40
  SYSTEM_ERROR: "An unexpected error occurred. Please try again later.",
};
