"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

import { registerSW, scheduleSparkReminders } from "@/lib/notifications";
import { useAppStore } from "@/lib/store";

type StoreContextValue = ReturnType<typeof useAppStore>;

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useAppStore();

  // SW 注册（只需一次）
  useEffect(() => {
    registerSW();
  }, []);

  // hydrate 完成后 + sparks 变化时，重新调度通知
  useEffect(() => {
    if (!store.hydrated) return;
    scheduleSparkReminders(store.state.sparks);
  }, [store.hydrated, store.state.sparks]);

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
