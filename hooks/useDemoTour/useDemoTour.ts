import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "billy-demo-tour-seen";
const SHEET_ANIMATION_MS = 300;

type DriverInstance = ReturnType<typeof driver>;

function isMobile() {
  return window.innerWidth < 768;
}

function dispatchSidebar(action: "open" | "close") {
  window.dispatchEvent(new CustomEvent(`billy:${action}-sidebar`));
}

const desktopSteps: DriveStep[] = [
  {
    element: "[data-tour='sidebar-nav']",
    popover: {
      title: "Navigate the app",
      description: "Switch between Bills, Payments, Vendors, and Reports from here.",
      side: "right",
    },
  },
  {
    element: "[data-tour='bills-table']",
    popover: {
      title: "Bills",
      description:
        "All your vendor bills in one place. Filter by status or vendor to find what you need.",
      side: "top",
    },
  },
  {
    element: "[data-tour='new-bill']",
    popover: {
      title: "Create a bill",
      description: "Start here — create a bill, submit it for approval, then schedule payment.",
      side: "bottom",
    },
  },
  {
    element: "[data-tour='sidebar-reports']",
    popover: {
      title: "AP Aging Report",
      description: "See what's overdue at a glance, broken down by time bucket.",
      side: "right",
    },
  },
];

function buildMobileSteps(d: DriverInstance): DriveStep[] {
  return [
    {
      element: "[data-sidebar-sheet] [data-tour='sidebar-nav']",
      popover: {
        title: "Navigate the app",
        description: "Switch between Bills, Payments, Vendors, and Reports from here.",
        side: "bottom",
        onNextClick: () => {
          dispatchSidebar("close");
          d.moveNext();
        },
      },
    },
    {
      element: "[data-tour='bills-table']",
      popover: {
        title: "Bills",
        description:
          "All your vendor bills in one place. Filter by status or vendor to find what you need.",
        side: "top",
      },
    },
    {
      element: "[data-tour='new-bill']",
      popover: {
        title: "Create a bill",
        description: "Start here — create a bill, submit it for approval, then schedule payment.",
        side: "bottom",
        onNextClick: () => {
          dispatchSidebar("open");
          setTimeout(() => d.moveNext(), SHEET_ANIMATION_MS);
        },
      },
    },
    {
      element: "[data-sidebar-sheet] [data-tour='sidebar-reports']",
      popover: {
        title: "AP Aging Report",
        description: "See what's overdue at a glance, broken down by time bucket.",
        side: "bottom",
        onPrevClick: () => {
          dispatchSidebar("close");
          setTimeout(() => d.movePrevious(), SHEET_ANIMATION_MS);
        },
      },
    },
  ];
}

function startTour() {
  const mobile = isMobile();

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayOpacity: 0.4,
    disableActiveInteraction: true,
    popoverClass: "billy-tour",
    steps: desktopSteps,
    onDestroyStarted: () => {
      if (mobile) dispatchSidebar("close");
      localStorage.setItem(TOUR_KEY, "1");
      driverObj.destroy();
    },
  });

  if (mobile) {
    driverObj.setSteps(buildMobileSteps(driverObj));
    dispatchSidebar("open");
    setTimeout(() => driverObj.drive(), SHEET_ANIMATION_MS);
  } else {
    driverObj.drive();
  }
}

export function restartTour() {
  localStorage.removeItem(TOUR_KEY);
  startTour();
}

interface UseDemoTourProps {
  isLoading: boolean;
}

export function useDemoTour({ isLoading }: UseDemoTourProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/bills") return;
    if (isLoading) return;
    if (!localStorage.getItem(TOUR_KEY)) startTour();
  }, [pathname, isLoading]);
}
