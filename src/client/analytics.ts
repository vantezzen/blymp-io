/**
 * Analytics Helper
 */
const createEvent = (name : string) => {
  window.sa_event(name);
}

export default createEvent;