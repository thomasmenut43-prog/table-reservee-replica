import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ReservationCalendar({ reservations, selectedDate, onSelectDate, onMonthChange, currentMonth }) {
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const reservationsByDay = useMemo(() => {
    const grouped = {};
    reservations.forEach(r => {
      const dayStr = format(new Date(r.dateTimeStart), 'yyyy-MM-dd');
      if (!grouped[dayStr]) {
        grouped[dayStr] = { midi: 0, soir: 0 };
      }
      if (r.serviceType === 'MIDI') {
        grouped[dayStr].midi += 1;
      } else {
        grouped[dayStr].soir += 1;
      }
    });
    return grouped;
  }, [reservations]);

  const getDayReservations = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return reservationsByDay[dayStr] || { midi: 0, soir: 0 };
  };

  return (
    <Card className="mt-6 max-w-lg">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onMonthChange(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onMonthChange(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {monthDays.map(day => {
            const dayRes = getDayReservations(day);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);
            const hasMidi = dayRes.midi > 0;
            const hasSoir = dayRes.soir > 0;

            return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                onClick={() => onSelectDate(day)}
                className={`
                  aspect-square p-1.5 rounded-lg text-xs font-semibold transition-all border
                  ${isSelected 
                    ? 'border-primary bg-primary/10' 
                    : isCurrentDay
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="h-full flex flex-col justify-between text-center">
                  <span className={`text-xs ${isCurrentDay ? 'text-primary font-bold' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex flex-col gap-0.5 justify-center">
                    {hasMidi && (
                      <div className="text-[9px] font-bold text-blue-600">
                        M{dayRes.midi}
                      </div>
                    )}
                    {hasSoir && (
                      <div className="text-[9px] font-bold text-orange-600">
                        S{dayRes.soir}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}