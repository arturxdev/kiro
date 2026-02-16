import {
  createContext,
  use,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { Modal, View } from "react-native";
import Purchases, {
  type CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import { useAuth } from "@clerk/clerk-expo";

const ENTITLEMENT_ID = "KIro Pro";

interface RevenueCatContextValue {
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  showPaywall: () => Promise<boolean>;
  showCustomerCenter: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
}

const RevenueCatContext = createContext<RevenueCatContextValue>({
  isPro: false,
  customerInfo: null,
  showPaywall: async () => false,
  showCustomerCenter: async () => {},
  restorePurchases: async () => false,
});

export function useRevenueCat(): RevenueCatContextValue {
  return use(RevenueCatContext);
}

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, userId } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const configuredRef = useRef(false);
  const purchaseResolveRef = useRef<((value: boolean) => void) | null>(null);

  useEffect(() => {
    if (configuredRef.current) return;
    configuredRef.current = true;

    try {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      const apiKey = "test_BGxGqfYjjIrRtPhHDChAjGeugHw";
      Purchases.configure({ apiKey });
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };

    try {
      Purchases.addCustomerInfoUpdateListener(handler);

      Purchases.getCustomerInfo()
        .then(setCustomerInfo)
        .catch(() => {});
    } catch {}

    return () => {
      try {
        Purchases.removeCustomerInfoUpdateListener(handler);
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn || !userId) return;

    Purchases.logIn(userId)
      .then(({ customerInfo: info }) => setCustomerInfo(info))
      .catch(() => {});
  }, [isSignedIn, userId]);

  const isPro =
    customerInfo?.entitlements.active[ENTITLEMENT_ID] !== undefined;

  const showPaywall = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      purchaseResolveRef.current = resolve;
      setPaywallVisible(true);
    });
  }, []);

  const closePaywall = useCallback((result: boolean) => {
    setPaywallVisible(false);
    purchaseResolveRef.current?.(result);
    purchaseResolveRef.current = null;
  }, []);

  const showCustomerCenter = useCallback(async (): Promise<void> => {
    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch {}
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch {
      return false;
    }
  }, []);

  return (
    <RevenueCatContext
      value={{
        isPro,
        customerInfo,
        showPaywall,
        showCustomerCenter,
        restorePurchases,
      }}
    >
      {children}
      <Modal
        visible={paywallVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => closePaywall(false)}
      >
        <View style={{ flex: 1 }}>
          <RevenueCatUI.Paywall
            options={{ displayCloseButton: true }}
            onPurchaseCompleted={() => closePaywall(true)}
            onRestoreCompleted={() => closePaywall(true)}
            onDismiss={() => closePaywall(false)}
          />
        </View>
      </Modal>
    </RevenueCatContext>
  );
}
