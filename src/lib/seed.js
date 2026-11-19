import { HOUR, MIN, startOfWeek, uid } from './time';

/** Erste Inbetriebnahme: 3 Beispielprojekte + 5 Einträge aus der aktuellen Woche. */
export function createSeedState(now = Date.now()) {
  const projects = [
    {
      id: uid(),
      name: 'Website-Relaunch',
      client: 'Bäckerei Hofmann GmbH',
      color: '#8170F5',
      rate: 85,
      budgetHours: 40,
      createdAt: now,
    },
    {
      id: uid(),
      name: 'Mobile App MVP',
      client: 'Lumen Health',
      color: '#2DD4BF',
      rate: 95,
      budgetHours: 120,
      createdAt: now,
    },
    {
      id: uid(),
      name: 'Brand-Workshop',
      client: 'Nordwind Studio',
      color: '#F59E0B',
      rate: 75,
      budgetHours: 12,
      createdAt: now,
    },
  ];
  const [web, app, brand] = projects;

  // [Wochentag-Offset ab Montag, Start, Ende, Projekt, Beschreibung, abrechenbar, Notiz]
  const plan = [
    [0, '09:00', '12:15', web, 'Startseite: Hero & Navigation umsetzen', true, ''],
    [0, '13:30', '14:45', web, 'Abstimmungs-Call & Angebot Phase 2', false, 'Angebot bis Freitag schicken'],
    [1, '10:00', '13:30', app, 'Onboarding-Flow in React Native', true, ''],
    [2, '14:00', '16:30', brand, 'Workshop-Vorbereitung: Moodboards', true, 'Vorab-Version an Kundin geschickt'],
    [3, '08:45', '10:15', app, 'Bugfixing Login & Push-Notifications', true, ''],
  ];

  const weekStart = startOfWeek(now);
  const todayIdx = Math.floor((now - weekStart) / (24 * HOUR));

  const entries = plan.map(([offset, from, to, project, description, billable, note], i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + Math.min(offset, todayIdx));
    const at = (hhmm) => {
      const [h, m] = hhmm.split(':').map(Number);
      const d = new Date(day);
      d.setHours(h, m, 0, 0);
      return d.getTime();
    };
    let start = at(from);
    let end = at(to);
    // Nie in der Zukunft anlegen (z. B. Montagmorgen): Eintrag nach hinten schieben.
    if (end > now) {
      const shift = end - now + (i + 1) * 15 * MIN;
      start -= shift;
      end -= shift;
    }
    return { id: uid(), description, projectId: project.id, billable, note, start, end };
  });

  return {
    version: 1,
    projects,
    entries: entries.sort((a, b) => b.start - a.start),
    timer: { description: '', projectId: null, billable: true, start: null },
  };
}
