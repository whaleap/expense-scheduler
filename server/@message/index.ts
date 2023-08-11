/**
 * 2xx Successful
 * ---------------------------------------------
 * 200 Success
 * ---------------------------------------------
 */

/**
 * @code 200 Success
 */
export const LOGIN_SUCCESS = "LOGIN_SUCCESS";
export const REGISTER_SUCCESS = "REGISTER_SUCCESS";
export const CONNECT_SUCCESS = "CONNECT_SUCCESS";
export const EMAIL_UPDATE_SUCCESS = "EMAIL_UPDATE_SUCCESS";

export const LOGIN_VERIFICATION_CODE_SENT = "LOGIN_VERIFICATION_CODE_SENT";
export const REGISTER_VERIFICATION_CODE_SENT =
  "REGISTER_VERIFICATION_CODE_SENT";
export const EMAIL_UPDATE_VERIFICATION_CODE_SENT =
  "EMAIL_UPDATE_VERIFICATION_CODE_SENT";

/**
 * 4xx Client Error
 * ---------------------------------------------
 * 400 Bad Request // 유효하지 않은 요청
 * 401 Unauthorized // 사용자 검증 실패
 * 403 Forbidden // 사용자 접근 거부
 * 404 Not Found // 리소스 없음
 * 409 Conflict // 데이터 상태가 충돌되는 요청
 * ---------------------------------------------
 */

/**
 * @code 400 Bad Request
 */
export const FIELD_REQUIRED = (field: string) =>
  `${field.toUpperCase()}_REQUIRED`;
/**
 * @code 400 Bad Request
 */
export const FIELD_INVALID = (field: string) =>
  `${field.toUpperCase()}_INVALID`;

/**
 * @code 401 Unauthorized
 */
export const INVALID_EMAIL = "INVALID_EMAIL";
export const EMAIL_IN_USE = "EMAIL_IN_USE";
export const SNSID_IN_USE = "SNSID_IN_USE";
export const CONNECTED_ALREADY = "CONNECTED_ALREADY";
export const USER_NOT_FOUND = "USER_NOT_FOUND";
export const VERIFICATION_CODE_WRONG = "VERIFICATION_CODE_WRONG";
export const VERIFICATION_CODE_EXPIRED = "VERIFICATION_CODE_EXPIRED";
export const LOCAL_LOGIN_DISABLED = "LOCAL_LOGIN_DISABLED";

/**
 * @code 403 Forbidden
 */
export const NOT_LOGGED_IN = "NOT_LOGGED_IN";
export const ALREADY_LOGGED_IN = "ALREADY_LOGGED_IN";
export const NOT_PERMITTED = "NOT_PERMITTED";

/**
 * @code 404 Not Found
 */
export const NOT_FOUND = (field: string) => `${field.toUpperCase()}_NOT_FOUND`;

/**
 * @code 409 Conflict
 */
export const AT_LEAST_ONE_SNSID_IS_REQUIRED = "AT_LEAST_ONE_SNSID_IS_REQUIRED";
export const CATEGORY_CANOT_BE_UPDATED = "CATEGORY_CANOT_BE_UPDATED";
export const INVALID_CATEGORY = "INVALID_CATEGORY";
export const PM_CANNOT_BE_REMOVED = "PM_CANNOT_BE_REMOVED";
export const PAIED_ALREADY = "PAIED_ALREADY";
export const FAKE_PAYMENT_ATTEMPT = "FAKE_PAYMENT_ATTEMPT";
export const PAYMENT_NOT_PAID = "PAYMENT_NOT_PAID";

/**
 * 5xx Server Error
 * ---------------------------------------------
 * 500 Internal Server Error
 * ---------------------------------------------
 */

/**
 * @code 500 Internal Server Error
 */
export const FETCHING_ACCESSTOKEN_FAILED = "FETCHING_ACCESSTOKEN_FAILED";
