
import React, { useEffect, useRef } from 'react';
import { driver, DriveStep } from "driver.js";

interface OnboardingTourProps {
  onComplete?: () => void;
  setCurrentView: (view: any) => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, setCurrentView }) => {
  const driverRef = useRef<any>(null);

  useEffect(() => {
    if (driverRef.current) return;
    
    // Check if tour already completed
    const hasSeenTour = localStorage.getItem('shelfie_tour_seen');
    if (hasSeenTour) return;

    // --- Transition Helper ---
    // Handles changing the React state and waiting for the DOM to be ready
    // This replaces fixed timeouts with a robust polling mechanism
    const driveToView = (viewId: string, selector: string, action: 'next' | 'prev') => {
        // 1. Switch View
        setCurrentView(viewId);

        // 2. Poll for Element (checks every 100ms)
        const start = Date.now();
        const check = setInterval(() => {
            const el = document.querySelector(selector);
            // Ensure element is actually connected and visible
            if (el) {
                clearInterval(check);
                // 3. Move Driver once element exists
                if (action === 'next') {
                    driverRef.current?.moveNext();
                } else {
                    driverRef.current?.movePrevious();
                }
            } else if (Date.now() - start > 3000) {
                // Timeout fallback (3s) to prevent hanging
                clearInterval(check);
                console.warn('Driver timeout waiting for', selector);
                // Try moving anyway to avoid getting stuck
                 if (action === 'next') driverRef.current?.moveNext();
                 else driverRef.current?.movePrevious();
            }
        }, 100);
    };

    const steps: DriveStep[] = [
      {
        element: '#nav-closet',
        popover: {
          title: 'Welcome to Shelfie',
          description: 'Your AI-powered digital closet. Let\'s take a quick tour.',
          side: 'bottom',
          align: 'start',
          // Step 0 -> Step 1 (Same View: Closet)
          onNextClick: () => driverRef.current?.moveNext(),
        }
      },
      {
        element: '#upload-zone',
        popover: {
          title: 'Digital Closet',
          description: 'Drag & drop clothes here. AI automatically analyzes color, season, and style.',
          side: 'top',
          align: 'center',
          // Step 1 -> Step 0 (Same View)
          onPrevClick: () => driverRef.current?.movePrevious(),
          // Step 1 -> Step 2 (Closet -> Studio)
          onNextClick: () => driveToView('studio', '#studio-canvas', 'next')
        }
      },
      {
        element: '#studio-canvas',
        popover: {
          title: 'The Studio',
          description: 'Mix and match items on the mannequin to build outfits.',
          side: 'right',
          align: 'start',
          // Step 2 -> Step 1 (Studio -> Closet)
          onPrevClick: () => driveToView('closet', '#upload-zone', 'prev'),
          // Step 2 -> Step 3 (Studio -> Plan)
          onNextClick: () => driveToView('plan', '#calendar-view', 'next')
        }
      },
      {
        element: '#calendar-view',
        popover: {
          title: 'Style Calendar',
          description: 'Schedule your looks for the week. Never stress about what to wear.',
          side: 'top',
          align: 'center',
          // Step 3 -> Step 2 (Plan -> Studio)
          onPrevClick: () => driveToView('studio', '#studio-canvas', 'prev'),
          // Step 3 -> Step 4 (Plan -> Trips)
          onNextClick: () => driveToView('trips', '#trips-nav', 'next')
        }
      },
      {
        element: '#trips-nav',
        popover: {
          title: 'Trip Planner',
          description: 'Planning a getaway? Let AI generate packing lists based on weather.',
          side: 'bottom',
          align: 'center',
           // Step 4 -> Step 3 (Trips -> Plan)
          onPrevClick: () => driveToView('plan', '#calendar-view', 'prev'),
          // Step 4 -> Step 5 (Trips -> Fitting Room)
          onNextClick: () => driveToView('fitting-room', '#nav-fitting-room', 'next')
        }
      },
      {
        element: '#nav-fitting-room',
        popover: {
          title: 'Virtual Try-On',
          description: 'See it before you wear it. Visualize any outfit on your digital twin.',
          side: 'bottom',
          align: 'end',
          doneBtnText: 'Finish & Start Uploading',
           // Step 5 -> Step 4 (Fitting Room -> Trips)
           onPrevClick: () => driveToView('trips', '#trips-nav', 'prev'),
        }
      }
    ];

    driverRef.current = driver({
      animate: true,
      allowClose: true,
      showProgress: true,
      steps: steps,
      onDestroyed: () => {
        localStorage.setItem('shelfie_tour_seen', 'true');
        setCurrentView('closet');
        if (onComplete) onComplete();
      }
    });

    driverRef.current.drive();

    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  return null;
};
