import type { OperatorPaymentProfile } from "@/types/domain";

export interface StripeConnectAdapter {
  ensureOperatorPaymentProfile(operatorId: string): Promise<OperatorPaymentProfile>;
}

class NoopStripeConnectAdapter implements StripeConnectAdapter {
  async ensureOperatorPaymentProfile(operatorId: string): Promise<OperatorPaymentProfile> {
    return {
      operatorId,
      provider: "stripe",
      onboardingStatus: "not_started",
      payoutsEnabled: false,
      detailsSubmitted: false,
      updatedAt: new Date().toISOString()
    };
  }
}

let adapter: StripeConnectAdapter = new NoopStripeConnectAdapter();

export function getStripeConnectAdapter() {
  return adapter;
}

export function setStripeConnectAdapter(nextAdapter: StripeConnectAdapter) {
  adapter = nextAdapter;
}
