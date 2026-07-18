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
              description: 'Navigate easily between the Resume Builder, Career Chat, and your Founder Dashboard using this sidebar.',
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
            element: '#tour-tab-ai',
            popover: {
              title: 'The AI Tailor',
              description: 'Start by uploading your file here, then paste a target job description to curate your resume specifically for that role.',
              side: 'bottom',
              align: 'center'
            },
            onHighlightStarted: () => {
              document.getElementById('tour-tab-ai')?.click();
            }
          },
          {
            element: '#tour-upload',
            popover: {
              title: 'Upload File',
              description: 'Click here to upload your existing PDF or DOCX resume to be parsed instantly.',
              side: 'right',
              align: 'center'
            }
          },
          {
            element: '#tour-jd-paste',
            popover: {
              title: 'Target Job Description',
              description: 'Paste the job description changes if you need it. The AI will analyze it to suggest keyword changes and optionally rewrite your resume.',
              side: 'left',
              align: 'start'
            }
          },
          {
            element: '#tour-tab-layout',
            popover: {
              title: 'Page Layout',
              description: 'While the preview shows on the right, when you go to the page layout, that\'s where you need to be able to select your segmentation and format.',
              side: 'bottom',
              align: 'center'
            },
            onHighlightStarted: () => {
              document.getElementById('tour-tab-layout')?.click();
            }
          },
          {
            element: '#tour-pagination',
            popover: {
              title: 'How to Segment',
              description: 'Hey, if you select this checkbox, this will go into the next page. This is how you actually segment it perfectly for an A4 export.',
              side: 'left',
              align: 'start'
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
