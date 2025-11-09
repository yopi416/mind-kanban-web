// ベースURL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// OIDC ログイン関連エンドポイント
export const OIDC_GOOGLE_LOGIN_ENDPOINT = API_BASE_URL + '/auth/login'
export const OIDC_GOOGLE_LOGOUT_ENDPOINT = API_BASE_URL + '/auth/logout'

// サービス関連エンドポイント
export const USER_PROFILE_ENDPOINT = API_BASE_URL + '/users/me'
export const MINKAN_ENDPOINT = API_BASE_URL + '/minkan'
export const HEALTHZ_ENDPOINT = API_BASE_URL + '/healthz' // テスト用
