
// Custom analytics events for tracking specific user actions
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  // Google Analytics 4
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, {
      custom_parameter: parameters,
      ...parameters
    });
  }

  // Facebook Pixel
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', eventName, parameters);
  }

  console.log(`Analytics Event: ${eventName}`, parameters);
};

// Specific tracking functions for your gym app
export const trackUserRegistration = (method: string = 'email') => {
  trackEvent('sign_up', {
    method: method,
    event_category: 'engagement',
    event_label: 'user_registration'
  });
};

export const trackProgramView = (programName: string, programId: string) => {
  trackEvent('view_item', {
    item_id: programId,
    item_name: programName,
    item_category: 'program',
    event_category: 'engagement'
  });
};

export const trackWorkoutStart = (programName: string, workoutType: string) => {
  trackEvent('workout_start', {
    program_name: programName,
    workout_type: workoutType,
    event_category: 'engagement',
    event_label: 'workout_interaction'
  });
};

export const trackWorkoutComplete = (programName: string, duration: number) => {
  trackEvent('workout_complete', {
    program_name: programName,
    duration_minutes: duration,
    event_category: 'achievement',
    event_label: 'workout_completion'
  });
};

export const trackContactForm = (formType: string) => {
  trackEvent('contact_form_submit', {
    form_type: formType,
    event_category: 'lead_generation',
    event_label: 'contact_form'
  });
};

export const trackProgramInquiry = (programName: string) => {
  trackEvent('generate_lead', {
    program_name: programName,
    event_category: 'lead_generation',
    event_label: 'program_inquiry'
  });
};

export const trackSearchQuery = (searchTerm: string, resultsCount: number) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
    event_category: 'engagement',
    event_label: 'site_search'
  });
};
