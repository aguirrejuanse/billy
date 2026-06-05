import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "billy-demo-tour-seen";

const steps = [
  {
    element: "nav",
    popover: {
      title: "Navigate the app",
      description: "Switch between Bills, Payments, Vendors, and Reports from here.",
      side: "right" as const,
    },
  },
  {
    element: "[data-tour='bills-table']",
    popover: {
      title: "Bills",
      description:
        "All your vendor bills in one place. Filter by status or vendor to find what you need.",
      side: "top" as const,
    },
  },
  {
    element: "[data-tour='new-bill']",
    popover: {
      title: "Create a bill",
      description: "Start here — create a bill, submit it for approval, then schedule payment.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='sidebar-reports']",
    popover: {
      title: "AP Aging Report",
      description: "See what's overdue at a glance, broken down by time bucket.",
      side: "right" as const,
    },
  },
];

function startTour() {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayOpacity: 0.4,
    disableActiveInteraction: true,
    steps,
    onDestroyStarted: () => {
      localStorage.setItem(TOUR_KEY, "1");
      driverObj.destroy();
    },
  });
  driverObj.drive();
}

export function restartTour() {
  localStorage.removeItem(TOUR_KEY);
  startTour();
}

export function useDemoTour() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/bills") return;
    if (!localStorage.getItem(TOUR_KEY)) startTour();
  }, [pathname]);
}
