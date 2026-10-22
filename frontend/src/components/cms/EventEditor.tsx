import React from 'react';
import { EventDetails } from '../../types';
import { Input } from '../ui/Input';
import { Calendar, MapPin, ExternalLink } from 'lucide-react';

interface EventEditorProps {
  details: EventDetails;
  onChange: (details: EventDetails) => void;
}

export const EventEditor: React.FC<EventEditorProps> = ({ details, onChange }) => {
  const handleChange = (field: keyof EventDetails, value: any) => {
    onChange({ ...details, [field]: value });
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-900">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-editorial-red" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Event & Conference Details
        </h3>
      </div>
      <p className="text-xs text-slate-500">
        Specify dates, venue location, map coordinates, and ticketing / registration URL.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          type="datetime-local"
          label="Start Date & Time"
          value={details.startDate ? new Date(details.startDate).toISOString().slice(0, 16) : ''}
          onChange={(e) => handleChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
        />
        <Input
          type="datetime-local"
          label="End Date & Time"
          value={details.endDate ? new Date(details.endDate).toISOString().slice(0, 16) : ''}
          onChange={(e) => handleChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Venue / Location Name"
          placeholder="e.g. Press Club Conference Hall"
          value={details.locationName || ''}
          onChange={(e) => handleChange('locationName', e.target.value)}
          leftIcon={<MapPin className="w-4 h-4 text-editorial-red" />}
        />
        <Input
          label="Full Physical Address"
          placeholder="e.g. 100 Fleet Street, London, EC4A 2AB"
          value={details.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Google Maps URL"
          placeholder="https://maps.google.com/?q=..."
          value={details.mapUrl || ''}
          onChange={(e) => handleChange('mapUrl', e.target.value)}
        />
        <Input
          label="External Registration / Event URL"
          placeholder="https://event.example.org/tickets"
          value={details.eventUrl || ''}
          onChange={(e) => handleChange('eventUrl', e.target.value)}
          leftIcon={<ExternalLink className="w-4 h-4 text-slate-400" />}
        />
      </div>
    </div>
  );
};
