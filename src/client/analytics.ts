/**
 * Analytics Helper
 */
const createEvent = (name : string) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'analytics',
    eventName: name
  });
}

export default createEvent;