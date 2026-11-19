"use client";

import { useEffect } from "react";
import { initializeErrorHandler } from "@/lib/errorLogger";

/**
 * Initialize error handling on client side
 */
export function ErrorHandlerInitializer() {
  useEffect(() => {
    initializeErrorHandler();
  }, []);

  return null;
}