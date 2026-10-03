// 1 ECO = N LKR. Shared by the Rewards page (display) and /api/record-payout
// (the amount actually recorded), so the two can never disagree.
// Configurable via NEXT_PUBLIC_ECO_TO_LKR_RATE; falls back to 10 if unset/invalid.
export const EXCHANGE_RATE = Number(process.env.NEXT_PUBLIC_ECO_TO_LKR_RATE) || 10
