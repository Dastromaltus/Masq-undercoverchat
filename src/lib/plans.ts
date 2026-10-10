export const PLANS = {
  plus: { priceId: "price_1UP4uTLPzknuwA5VMzNr3XLg", productId: "prod_VPujLNTRYO3CSz" },
  creator: { priceId: "price_1UP4ueLPzknuwA5VSvlECyzf", productId: "prod_VPukfcdTIydLjV" },
  community: { priceId: "price_1UP4vELPzknuwA5VrTj4rEHD", productId: "prod_VPukpGVYeysGvW" },
} as const;

export type PlanKey = keyof typeof PLANS;
