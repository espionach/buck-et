import { Calendar as CalendarIcon } from "lucide-react";

const Calendar = () => {
  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
      <p className="text-sm text-muted-foreground mb-10">
        See your upcoming sidequests in one place.
      </p>
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-24">
        <CalendarIcon className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-semibold text-foreground">Coming soon</p>
        <p className="text-xs mt-1">A calendar view of all your sidequests is on the way.</p>
      </div>
    </div>
  );
};

export default Calendar;
