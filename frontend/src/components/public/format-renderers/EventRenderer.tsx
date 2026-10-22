import React from 'react';
import { EventDetails } from '../../../types';
import { Calendar, MapPin, ExternalLink, Navigation } from 'lucide-react';

interface EventRendererProps {
  eventDetails?: EventDetails;
}

export const EventRenderer: React.FC<EventRendererProps> = ({ eventDetails }) => {
  if (!eventDetails) return null;

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formattedStart = formatDate(eventDetails.startDate);
  const formattedEnd = formatDate(eventDetails.endDate);

  return (
    <aside className="my-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-4">
        <Calendar className="w-4 h-4" />
        <span>Event Details</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date & Time */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Schedule
          </div>
          {formattedStart && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Begins</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formattedStart}</p>
              </div>
            </div>
          )}
          {formattedEnd && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Concludes</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formattedEnd}</p>
              </div>
            </div>
          )}
        </div>

        {/* Location & External Links */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Venue & Location
          </div>
          {(eventDetails.locationName || eventDetails.address) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                {eventDetails.locationName && (
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {eventDetails.locationName}
                  </p>
                )}
                {eventDetails.address && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {eventDetails.address}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {eventDetails.mapUrl && (
              <a
                href={eventDetails.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                View location
              </a>
            )}
            {eventDetails.eventUrl && (
              <a
                href={eventDetails.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Official Event Website
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
