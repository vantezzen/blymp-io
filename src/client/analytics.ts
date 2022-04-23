/**
 * Analytics Helper
 */
const createEvent = (name: string) => {
  window.sa_event(name);
  if (window.gtag) {
    window.gtag("event", name);
  }
};

export default createEvent;
