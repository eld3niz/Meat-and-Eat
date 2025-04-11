import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Default styling
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabaseClient';
import { MeetupProposal } from '../types/meetup'; // Assuming this type is suitable, might need adjustments
import { format, isSameDay, startOfDay } from 'date-fns';
import MeetupRequestRow from '../components/meetups/MeetupRequestRow'; // Reuse for display, might need adaptation

type ValuePiece = Date | null;
type CalendarValue = ValuePiece | [ValuePiece, ValuePiece];

const HistoryPage = () => {
  const { user } = useAuth();
  const [finalizedMeetups, setFinalizedMeetups] = useState<MeetupProposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Default to today

  const fetchFinalizedMeetups = useCallback(async () => {
    if (!user) {
      setFinalizedMeetups([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('meetup_proposals')
        .select(`
          *,
          sender:sender_id ( name, avatar_url ),
          recipient:recipient_id ( name, avatar_url )
        `) // Fetch both sender and recipient profiles
        .eq('status', 'finalized')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('meetup_time', { ascending: true });

      if (fetchError) throw fetchError;

      // Basic formatting/type casting if needed
      const formattedData = data?.map(p => ({
          ...p,
          // Ensure profiles are handled correctly, maybe combine sender/recipient based on who *isn't* the current user?
          // For now, keep both, MeetupRequestRow might need adjustment or use a different component
          profiles: p.sender?.id === user.id ? p.recipient : p.sender, // Simplified profile for display
      })) || [];


      setFinalizedMeetups(formattedData as MeetupProposal[]); // Adjust type casting as needed
    } catch (err: any) {
      console.error("Error fetching finalized meetups:", err);
      setError(`Failed to load history: ${err.message}`);
      setFinalizedMeetups([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFinalizedMeetups();
  }, [fetchFinalizedMeetups]);

  // Memoize dates with meetups for calendar highlighting
  const meetupDates = useMemo(() => {
    const dates = new Set<string>();
    finalizedMeetups.forEach(meetup => {
      dates.add(startOfDay(new Date(meetup.meetup_time)).toISOString());
    });
    return dates;
  }, [finalizedMeetups]);

  // Filter meetups for the selected date
  const meetupsOnSelectedDate = useMemo(() => {
    return finalizedMeetups.filter(meetup =>
      isSameDay(new Date(meetup.meetup_time), selectedDate)
    );
  }, [finalizedMeetups, selectedDate]);

  const handleDateChange = (value: CalendarValue) => {
    // We expect a single date, not a range
    if (value instanceof Date) {
      setSelectedDate(value);
    } else if (Array.isArray(value) && value[0] instanceof Date) {
      // Handle range selection if needed, for now just take the start date
      setSelectedDate(value[0]);
    }
  };

  // Function to add custom styling or content to calendar tiles
  const tileClassName = ({ date, view }: { date: Date; view: string }): string | null => {
    if (view === 'month') {
      const dateStr = startOfDay(date).toISOString();
      if (meetupDates.has(dateStr)) {
        return 'bg-green-200 rounded-full'; // Highlight dates with meetups
      }
    }
    return null;
  };

  return (
    <div className="container mx-auto p-4 flex flex-col md:flex-row gap-4">
      {/* Calendar Section */}
      <div className="w-full md:w-1/3 lg:w-1/4">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Meetup History</h2>
        <div className="bg-white p-3 rounded-lg shadow">
           <Calendar
             onChange={handleDateChange}
             value={selectedDate}
             tileClassName={tileClassName}
             className="border-none" // Remove default border
           />
        </div>
      </div>

      {/* Meetup List Section */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">
          Meetups on: {format(selectedDate, 'PPP')} {/* Format selected date */}
        </h3>
        {isLoading ? (
          <p className="text-gray-500">Loading history...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : meetupsOnSelectedDate.length === 0 ? (
          <p className="text-gray-500">No finalized meetups on this date.</p>
        ) : (
          <div className="space-y-0 bg-white rounded-lg shadow overflow-hidden">
            {meetupsOnSelectedDate.map(meetup => (
              // Reuse MeetupRequestRow for display.
              // NOTE: It expects handlers which aren't needed here.
              // We might need to make handlers optional or create a dedicated display component.
              // For now, pass dummy/empty functions or adjust MeetupRequestRow later.
              <MeetupRequestRow
                key={meetup.id}
                proposal={meetup}
                onViewProfile={() => {}} // Dummy handler
                onViewLocation={() => {}} // Dummy handler
                // Pass no action handlers as this is display-only
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;