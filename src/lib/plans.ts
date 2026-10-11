export const PLANS = {
  plus: { priceId: "price_1UPNjBLLK8Bn98cXB6WgWQdt", productId: "prod_VQEBUpYdE3dIiB" },
  creator: { priceId: "price_1UPNk9LLK8Bn98cXJ4BtZG4N", productId: "prod_VQECefCYdgAZDz" },
  community: { priceId: "price_1UPNkjLLK8Bn98cXJMMdezwM", productId: "prod_VQED6WBofq9ZAR" },
} as const;

export type PlanKey = keyof typeof PLANS;
