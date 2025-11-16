'use client'

import { useState, useMemo, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import '../../app/calendar.css'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export type AppointmentEvent = {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
    patientName: string
    doctorName: string
    serviceName: string
    notes?: string
  }
}

interface AppointmentCalendarProps {
  events: AppointmentEvent[]
  onSelectEvent?: (event: AppointmentEvent) => void
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
  defaultView?: View
  defaultDate?: Date
}

export function AppointmentCalendar({
  events,
  onSelectEvent,
  onSelectSlot,
  defaultView = 'week',
  defaultDate = new Date(),
}: AppointmentCalendarProps) {
  const [view, setView] = useState<View>(defaultView)
  const [date, setDate] = useState(defaultDate)

  const { components, eventStyleGetter } = useMemo(() => {
    const eventStyleGetter = (event: AppointmentEvent) => {
      const status = event.resource.status
      let className = 'rbc-event-'

      switch (status) {
        case 'scheduled':
          className += 'scheduled'
          break
        case 'confirmed':
          className += 'confirmed'
          break
        case 'completed':
          className += 'completed'
          break
        case 'cancelled':
          className += 'cancelled'
          break
        default:
          className += 'scheduled'
      }

      return {
        className,
      }
    }

    const components = {
      event: ({ event }: { event: AppointmentEvent }) => (
        <div className="px-1">
          <div className="font-medium text-xs">{event.resource.patientName}</div>
          <div className="text-xs opacity-90">{event.resource.serviceName}</div>
        </div>
      ),
    }

    return { components, eventStyleGetter }
  }, [])

  const handleSelectEvent = useCallback(
    (event: AppointmentEvent) => {
      if (onSelectEvent) {
        onSelectEvent(event)
      }
    },
    [onSelectEvent]
  )

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      if (onSelectSlot) {
        onSelectSlot(slotInfo)
      }
    },
    [onSelectSlot]
  )

  return (
    <div className="h-full">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        components={components}
        step={30}
        timeslots={2}
        min={new Date(2024, 0, 1, 9, 0, 0)} // 9 AM
        max={new Date(2024, 0, 1, 17, 0, 0)} // 5 PM
        defaultView={defaultView}
        views={['month', 'week', 'day']}
        formats={{
          timeGutterFormat: 'h:mm a',
          eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'h:mm a', culture)} - ${localizer?.format(end, 'h:mm a', culture)}`,
          agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'h:mm a', culture)} - ${localizer?.format(end, 'h:mm a', culture)}`,
        }}
      />
    </div>
  )
}
