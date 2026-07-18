import { useEffect } from 'react';
import { driver } from 'driver.js';

export const OnboardingTour = () => {
  useEffect(() => {
    // Only run on client side and check if tour was already completed
    if (typeof window === 'undefined') return;
    
    const hasCompletedTour = localStorage.getItem('pm_tour_completed');
    if (hasCompletedTour === 'true') return;

    // Small delay to ensure all DOM elements are mounted
    const timeout = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        smoothScroll: true,
        allowClose: true,
        overlayColor: 'rgba(15, 11, 30, 0.5)',
        onPopoverRender: (popover, { state }) => {
          // Custom class for our liquid glass theme is applied globally via index.css
          // But we can manipulate DOM here if strictly needed
        },
        onDestroyStarted: () => {
          if (!driverObj.hasNextStep() || confirm("Are you sure you want to skip the rest of the tour?")) {
            localStorage.setItem('pm_tour_completed', 'true');
            driverObj.destroy();
          }
        },
        steps: [
          {
            element: '#tour-sidebar',
            popover: {
              title: 'Welcome to Precision Match!',
              description: 'Navigate easily between the Resume Builder, AI Career Coach, and your Founder Dashboard using this sidebar.',
              side: 'right',
              align: 'start'
            }
          },
          {
            element: '#tour-credits',
            popover: {
              title: 'AI Credits',
              description: 'Keep an eye on your AI Credits. Every smart action (like generating a cover letter or doing a mock interview) consumes a credit.',
              side: 'right',
              align: 'start'
            }
          },
          {
            element: '#tour-ai-tailor',
            popover: {
              title: 'The AI Tailor',
              description: 'Use the AI Tailor to automatically customize your entire resume to match specific job descriptions in seconds.',
              side: 'bottom',
              align: 'center'
            }
          }
        ]
      });

      // We need to verify elements exist before starting to avoid errors if user is on a different route
      const sidebarExists = document.querySelector('#tour-sidebar');
      if (sidebarExists) {
        driverObj.drive();
      }
    }, 1500); // 1.5s delay to allow animations and routing to settle

    return () => clearTimeout(timeout);
  }, []);

  return null;
};
