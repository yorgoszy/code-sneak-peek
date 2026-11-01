const DAYS = [
  ['monday', 'Δευτέρα'],
  ['tuesday', 'Τρίτη'],
  ['wednesday', 'Τετάρτη'],
  ['thursday', 'Πέμπτη'],
  ['friday', 'Παρασκευή'],
  ['saturday', 'Σάββατο'],
  ['sunday', 'Κυριακή']
] as const;

export function BookingSectionSchedulePreview({ availableHours }: {
  availableHours: Record<string, string[]>;
}) {
  const hours = [...new Set(DAYS.flatMap(([day]) => availableHours[day] || []))].sort();

  if (hours.length === 0) return <p className="text-xs text-muted-foreground">Καμία ημέρα</p>;

  return (
    <table aria-label="Ωράριο τμήματος" className="w-full table-fixed border-collapse text-[10px] leading-3">
      <thead>
        <tr>
          <th className="w-10" />
          {DAYS.map(([day, label]) => (
            <th key={day} scope="col" title={label} aria-label={label} className="pb-1 text-center font-medium text-foreground">
              {label.charAt(0)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {hours.map(hour => (
          <tr key={hour}>
            <th scope="row" className="pr-1 text-left font-normal text-muted-foreground">{hour}</th>
            {DAYS.map(([day, label]) => {
              const scheduled = availableHours[day]?.includes(hour) || false;
              return (
                <td key={day} className="p-px" title={`${label} ${hour}${scheduled ? '' : ' — κενό'}`}>
                  <div className={`h-3 border ${scheduled ? 'bg-primary border-primary' : 'bg-background border-border'}`}>
                    <span className="sr-only">{scheduled ? `${label} ${hour}` : 'Κενό'}</span>
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}