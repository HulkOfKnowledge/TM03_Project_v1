/**
 * Flinks API Type Definitions
 *
 * Types in the "GetAccountsDetail Response" section use PascalCase to mirror
 * the exact JSON field names returned by the Flinks v3 REST API.
 * See: https://docs.flinks.com/api/connect/endpoints/account-linking/get-accounts-detail
 *
 * Service-level request/response wrappers further below are camelCase and are
 * used by FlinksService method signatures.
 */

// ─── GetAccountsDetail – exact Flinks API shapes ────────────────────────────

/**
 * Single transaction returned inside an account's Transactions array.
 * Flinks /GetAccountsDetail endpoint.
 */
export interface FlinksTransactionDetail {
  Id: string;
  Date: string;          // 'YYYY-MM-DD'
  Description: string;
  Debit: number | null;  // purchase / spend  – positive means balance rises
  Credit: number | null; // payment / refund  – positive means balance falls
  Balance: number;       // running card balance after this transaction
  Code: string | null;
}

/** Account-holder address embedded in FlinksAccountDetail */
export interface FlinksHolderAddress {
  CivicAddress: string;
  City: string;
  Province: string;
  PostalCode: string;
  POBox: string | null;
  Country: string;
}

/** Account holder information embedded in FlinksAccountDetail */
export interface FlinksHolder {
  Name: string;
  Address: FlinksHolderAddress;
  Email: string;
  PhoneNumber: string;
}

/**
 * Full account object inside the Accounts array of /GetAccountsDetail.
 * Type = 'CreditCard' | 'LineOfCredit' for the cards we care about.
 */
export interface FlinksAccountDetail {
  Id: string;
  Title: string;
  AccountNumber: string;
  LastFourDigits: string | null;
  TransitNumber: string;
  InstitutionNumber: string;
  Balance: {
    Available: number;   // = Limit − Current for credit cards
    Current: number;     // amount owed on the credit card
    Limit: number;       // credit limit
  };
  Category: string;      // e.g. 'Operations'
  Type: string;          // 'CreditCard' | 'LineOfCredit' | 'Chequing' | …
  Currency: string;      // 'CAD' | 'USD'
  Holder: FlinksHolder;
  Transactions: FlinksTransactionDetail[];
  AccountType: 'Personal' | 'Business' | null;
}

/**
 * Top-level response from POST /v3/{customerId}/BankingServices/GetAccountsDetail
 */
export interface FlinksGetAccountsDetailResponse {
  HttpStatusCode: number;
  Accounts: FlinksAccountDetail[];
  InstitutionName: string;
  Login: {
    Username: string;
    IsScheduledRefresh: boolean;
    LastRefresh: string; // ISO 8601
    Type: string;        // 'Personal' | 'Business'
    Id: string;
  };
  InstitutionId: number;
  Institution: string;
  RequestId: string;
}

// ─── Authorization ───────────────────────────────────────────────────────────

export interface FlinksAuthorizationRequest {
  redirectUrl: string;
  institutionId?: string;
  language?: 'en' | 'fr';
  theme?: 'light' | 'dark';
}

export interface FlinksAuthorizationResponse {
  loginId: string;
  redirectUrl: string;
  institutionId?: string;
}

// ─── Service-level request / response wrappers ───────────────────────────────

export interface FlinksGetAccountsRequest {
  loginId: string;
  requestId?: string;
  daysOfTransactions?: 'Days90' | 'Days365';
}

export type FlinksGetAccountsResponse = FlinksGetAccountsDetailResponse;

export interface FlinksGetTransactionsRequest {
  loginId: string;
  accountId: string;
  startDate?: string;
  endDate?: string;
}

export interface FlinksGetTransactionsResponse {
  transactions: FlinksTransactionDetail[];
}

export interface FlinksSyncRequest {
  loginId: string;
  mostRecentCached?: boolean;
}

export interface FlinksSyncResponse {
  status: 'success' | 'pending' | 'error';
  loginId: string;
  accounts: FlinksAccountDetail[];
  lastRefresh: string;
}

// ─── Error ───────────────────────────────────────────────────────────────────

export interface FlinksErrorResponse {
  error: string;
  errorCode: string;
  message: string;
  requestId?: string;
}

// ─── Type guard ──────────────────────────────────────────────────────────────

export function isFlinksError(
  response: FlinksGetAccountsDetailResponse | FlinksErrorResponse
): response is FlinksErrorResponse {
  return 'error' in response;
}
