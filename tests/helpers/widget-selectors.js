const widgetSelectors = {
  widgetRootCandidates: ['.events-widget', '.widget-events', '#events-widget'],
  eventCardCandidates: ['.events-widget .event-item', '.event-item', '[class*="event"][class*="item"]'],
  clickableEventCandidates: ['a.event-item', '.event-item a', '.event-item [role="link"]']
};

module.exports = { widgetSelectors };
