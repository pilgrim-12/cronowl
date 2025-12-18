import { initializePaddle, Paddle } from "@paddle/paddle-js";

let paddleInstance: Paddle | null = null;

export async function getPaddle(): Promise<Paddle> {
  if (paddleInstance) return paddleInstance;

  const environment =
    process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
      ? "production"
      : "sandbox";

  const result = await initializePaddle({
    environment,
    token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
  });

  if (!result) {
    throw new Error("Failed to initialize Paddle");
  }

  paddleInstance = result;
  return paddleInstance;
}

export const PADDLE_PRICES = {
  starter: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || "pri_01kcrqndhavchav36qazd8gnsk",
  pro: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || "pri_01kcrqgxrvnt77bwb99t209py1",
} as const;

export type PaddlePlan = keyof typeof PADDLE_PRICES;

export async function openCheckout(
  plan: PaddlePlan,
  userId: string,
  userEmail: string
) {
  const paddle = await getPaddle();
  const priceId = PADDLE_PRICES[plan];

  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: { email: userEmail },
    customData: {
      userId,
      project: "cronowl",
    },
    settings: {
      displayMode: "overlay",
      theme: "dark",
      successUrl: `${window.location.origin}/dashboard?subscription=success`,
    },
  });
}

export function getPlanFromPriceId(priceId: string): "starter" | "pro" | null {
  if (priceId === PADDLE_PRICES.starter) return "starter";
  if (priceId === PADDLE_PRICES.pro) return "pro";
  return null;
}
