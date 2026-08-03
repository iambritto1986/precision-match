import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';

declare global {
  interface Window {
    startTour: () => void;
  }
}

export const OnboardingTour = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const startTour = () => {
      navigate('/resume');
      const driverObj = driver({
        showProgress: true,
        smoothScroll: true,
        allowClose: true,
        showButtons: ['next', 'previous', 'close'],
        overlayColor: 'rgba(15, 11, 30, 0.8)',
        onDestroyStarted: () => {
          localStorage.setItem('pm_tour_completed', 'true');
          driverObj.destroy();
        },
        steps: [
          {
            element: '#tour-sidebar',
            popover: {
              title: 'Welcome to Precision Match!',
              description: 'Use this sidebar to move between the Resume Builder, Career Chat, and Live Interview Practice.',
              side: 'right',
              align: 'start'
            }
          },
          {
            element: '#tour-credits',
            popover: {
              title: 'AI Credits',
              description: 'Keep an eye on your AI Credits. Every smart action (like generating a cover letter or doing a mock interview) consumes a credit.',
              // Anchor moved from the sidebar to the workspace header, so the
              // popover has to come from below, not from the right.
              side: 'bottom',
              align: 'end'
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
              description: 'Paste the job description you\'re applying to. The AI analyzes it and suggests keyword changes, or rewrites your resume to match.',
              side: 'left',
              align: 'start'
            }
          },
          {
            element: '#tour-tab-layout',
            popover: {
              title: 'Page Layout',
              description: 'Switch here to fine-tune formatting and page breaks, while your live preview keeps updating on the right.',
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
              description: 'Check this box to push a section onto the next page — the easiest way to keep your layout clean for a printed or PDF export.',
              side: 'left',
              align: 'start'
            }
          },
          {
            element: '#tour-career-chat',
            popover: {
              title: 'AI Career Coach',
              description: 'Chat with your AI career advisor for resume tips, interview strategies, and career guidance. Free users get 5 free messages to try it out!',
              side: 'right',
              align: 'start'
            }
          },
          {
            element: '#tour-live-interview',
            popover: {
              title: 'Live AI Interview Practice',
              description: 'Practice real-time voice interviews with an AI coach. Free users get a 2-minute trial session.',
              side: 'right',
              align: 'start'
            }
          }
        ]
      });

      const sidebarExists = document.querySelector('#tour-sidebar');
      if (sidebarExists) {
        driverObj.drive();
      }
    };

    window.startTour = startTour;

    const hasCompletedTour = localStorage.getItem('pm_tour_completed');
    if (hasCompletedTour !== 'true') {
      const timeout = setTimeout(startTour, 1500);
      return () => clearTimeout(timeout);
    }
  }, []);

  return null;
};
