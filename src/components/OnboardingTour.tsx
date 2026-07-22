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
          },
          {
            element: '#tour-career-chat',
            popover: {
              title: '💬 AI Career Coach',
              description: 'Chat with your AI career advisor for resume tips, interview strategies, and career guidance. Free users get 5 free messages to try it out!',
              side: 'right',
              align: 'start'
            }
          },
          {
            element: '#tour-live-interview',
            popover: {
              title: '🎙️ Live AI Interview Practice',
              description: 'Practice real-time voice interviews with our AI coach powered by a stunning ferrofluid orb interface. Free users get a 2-minute trial session!',
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
