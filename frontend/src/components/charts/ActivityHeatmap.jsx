import { useMemo } from 'react';

const ActivityHeatmap = ({ data = [] }) => {
  const { weeks, months } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // 52 weeks

    // Create a map of date -> count
    const dateMap = {};
    data.forEach((d) => {
      const dateStr = new Date(d.date).toISOString().split('T')[0];
      dateMap[dateStr] = parseInt(d.count) || 0;
    });

    const weeks = [];
    let currentWeek = [];
    const monthLabels = [];
    let lastMonth = -1;
    const current = new Date(startDate);

    // Pad first week
    const startDay = current.getDay();
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null);
    }

    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      const month = current.getMonth();

      if (month !== lastMonth) {
        monthLabels.push({
          label: current.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex: weeks.length,
        });
        lastMonth = month;
      }

      currentWeek.push({
        date: dateStr,
        count: dateMap[dateStr] || 0,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, months: monthLabels };
  }, [data]);

  const getColor = (count) => {
    if (!count || count === 0) return '#1e293b';
    if (count === 1) return '#312e81';
    if (count <= 3) return '#4338ca';
    if (count <= 5) return '#6366f1';
    return '#818cf8';
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-fit">
        {/* Month labels */}
        <div className="flex gap-[3px] ml-8 mb-1">
          {months.map((m, i) => (
            <div
              key={i}
              className="text-xs text-surface-500"
              style={{ marginLeft: `${m.weekIndex * 15}px`, position: i === 0 ? 'relative' : 'absolute', left: `${m.weekIndex * 15 + 32}px` }}
            >
              {m.label}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-2">
            {dayLabels.map((label, i) => (
              <div key={i} className="w-4 h-3 text-[10px] text-surface-500 flex items-center">
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className="w-3 h-3 rounded-sm transition-colors duration-200 hover:ring-1 hover:ring-surface-500"
                    style={{ backgroundColor: day ? getColor(day.count) : 'transparent' }}
                    title={day ? `${day.date}: ${day.count} solved` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-8">
          <span className="text-xs text-surface-500">Less</span>
          {[0, 1, 2, 4, 6].map((count) => (
            <div
              key={count}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getColor(count) }}
            />
          ))}
          <span className="text-xs text-surface-500">More</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
