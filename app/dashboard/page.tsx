// app/dashboard/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { listHabits, listLogs, todayISO } from '../lib/storage';
import type { Habit } from '../lib/storage';
import { useI18n } from '../lib/i18n';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

type DayCell = { date: string; label: string; done: boolean; value?: number };

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number): { date: string; label: string }[] {
  const out: { date: string; label: string }[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const label = d.toLocaleDateString('es', { weekday: 'short' });
    out.push({ date: isoDate(d), label });
  }
  return out;
}

function calcStreak(days: DayCell[]): number {
  let c = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].done) c++;
    else break;
  }
  return c;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [period, setPeriod] = useState<7 | 14 | 30>(7);
  const [ready, setReady] = useState(false);
  
  // 🆕 ESTADO PARA EL COACH AI
  const [aiCoachMessage, setAiCoachMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');


  useEffect(() => {
    setHabits(listHabits());
    setReady(true);
  }, []);

  const logs = useMemo(() => listLogs(), [ready]);
  const days = useMemo(() => lastNDays(period), [period]);

  const rows = useMemo(() => {
    return habits.map((h) => {
      const cells: DayCell[] = days.map((d) => {
        const log = logs.find((l) => l.habitId === h.id && l.date === d.date);
        const done = h.type === 'check' ? Boolean(log?.done) : (typeof log?.value === 'number' && log.value > 0);
        const value = typeof log?.value === 'number' ? log!.value : undefined;
        return { date: d.date, label: d.label, done, value };
      });

      const hits = cells.filter((c) => c.done).length;
      const pct = Math.min(100, Math.round((hits / Math.max(1, h.goalPerWeek)) * 100));
      const sum = cells.reduce((acc, c) => acc + (c.value ?? 0), 0);
      const streak = calcStreak(cells);

      return { habit: h, cells, hits, pct, sum, streak };
    });
  }, [habits, logs, days]);

  // Datos para gráfico de barras (actividad por día)
  const activityByDay = useMemo(() => {
    return days.map(day => ({
      date: day.label,
      completados: logs.filter(l => l.date === day.date).length,
    }));
  }, [days, logs]);

  // Datos para gráfico de líneas (progreso acumulado)
  const cumulativeProgress = useMemo(() => {
    let cumulative = 0;
    return days.map(day => {
      const dayLogs = logs.filter(l => l.date === day.date).length;
      cumulative += dayLogs;
      return {
        date: day.label,
        total: cumulative,
      };
    });
  }, [days, logs]);

  // Datos para radar (cumplimiento por hábito)
  const radarData = useMemo(() => {
    return rows.slice(0, 6).map(row => ({
      habit: row.habit.title.slice(0, 15) + (row.habit.title.length > 15 ? '...' : ''),
      cumplimiento: row.pct,
    }));
  }, [rows]);

  // Estadísticas generales
  const stats = useMemo(() => {
    const totalHabits = habits.length;
    const totalLogs = logs.length;
    const avgCompletion = rows.length > 0
      ? Math.round(rows.reduce((sum, r) => sum + r.pct, 0) / rows.length)
      : 0;
    const bestStreak = rows.length > 0
      ? Math.max(...rows.map(r => r.streak))
      : 0;

    return { totalHabits, totalLogs, avgCompletion, bestStreak };
  }, [habits, logs, rows]);
  
  // 🆕 LÓGICA DEL COACH MOTIVACIONAL AI
  const handleAiCoach = async () => {
    setAiLoading(true);
    setAiError('');
    setAiCoachMessage('');

    const context = `El usuario tiene ${stats.totalHabits} hábitos, ${stats.totalLogs} registros en el período, un cumplimiento promedio de ${stats.avgCompletion}%, y su mejor racha es de ${stats.bestStreak} días.`;

    const systemPrompt = "Eres un Coach Motivacional AI. Tu trabajo es dar un mensaje de ánimo y motivación de una sola frase (máximo 12 palabras) basado en las estadísticas del usuario. No uses emojis.";

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, systemPrompt }),
      });

      if (!res.ok) throw new Error(t('dashboard.aiCoachError'));

      const data = await res.json();
      setAiCoachMessage(data.response);
    } catch (err) {
      setAiError(t('dashboard.aiCoachError'));
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };


  if (!ready) return null;

  return (
    <main className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        
        {/* Selector de período */}
        <div className="flex gap-2">
          {[7, 14, 30].map(n => (
            <button
              key={n}
              onClick={() => setPeriod(n as 7 | 14 | 30)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                period === n
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {n} {t('dashboard.days')}
            </button>
          ))}
        </div>
      </div>
      
      {/* 🆕 COACH MOTIVACIONAL AI */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('dashboard.aiCoachTitle')}</h2>
        
        <div className="flex items-center justify-between gap-4">
            <p className="text-lg font-medium text-gray-800 italic flex-1">
                {aiCoachMessage || (aiError ? t('dashboard.aiCoachError') : "..." )}
            </p>
            <button
                onClick={handleAiCoach}
                disabled={aiLoading}
                className="px-5 py-2 rounded-lg bg-orange-600 text-white font-medium shadow hover:bg-orange-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {aiLoading ? t('dashboard.aiCoachLoading') : t('dashboard.aiCoachButton')}
            </button>
        </div>
      </div>
      
      {/* Estadísticas generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm text-indigo-700 font-medium">{t('dashboard.activeHabits')}</p>
          <p className="text-3xl font-bold text-indigo-900 mt-1">{stats.totalHabits}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 font-medium">{t('dashboard.totalRecords')}</p>
          <p className="text-3xl font-bold text-green-900 mt-1">{stats.totalLogs}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium">{t('dashboard.avgCompletion')}</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{stats.avgCompletion}%</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-700 font-medium">{t('dashboard.bestStreak')}</p>
          <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.bestStreak} 🔥</p>
        </div>
      </div>

      {/* Gráficos */}
      {habits.length === 0 ? (
        <div className="text-center py-12 bg-white border-2 border-dashed border-gray-300 rounded-xl">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('dashboard.noData')}
          </h3>
          <p className="text-gray-600">
            {t('dashboard.noDataDesc')}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Gráfico de barras - Actividad diaria */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.dailyActivity')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completados" fill="#8b5cf6" name={t('dashboard.habitsCompleted')} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de líneas - Progreso acumulado */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.cumulativeProgress')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativeProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={3}
                  name={t('dashboard.totalRecordsChart')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Radar - Cumplimiento por hábito */}
          {radarData.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">{t('dashboard.habitCompletion')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="habit" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name={t('dashboard.completionPercent')}
                    dataKey="cumplimiento"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Detalle por hábito */}
      {habits.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.habitDetail')}</h2>
          <div className="grid gap-4">
            {rows.map((row) => (
              <section key={row.habit.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{row.habit.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('habits.goal')}: {row.habit.goalPerWeek}/{t('common.week')} · {t('dashboard.habitType')}:{' '}
                      {row.habit.type === 'check' ? t('dashboard.checkHabit') : t('dashboard.quantityHabit')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{t('dashboard.progress')}</p>
                        <p className="text-xl font-bold text-gray-900">
                          {row.hits}/{row.habit.goalPerWeek}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{t('habits.streak')}</p>
                        <p className="text-xl font-bold text-orange-600">
                          {row.streak} 🔥
                        </p>
                      </div>
                    </div>
                    <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    {row.habit.type === 'number' && (
                      <p className="text-sm text-gray-600">
                        {t('habits.totalPeriod')}: {row.sum}
                      </p>
                    )}
                  </div>
                </div>

                {/* Timeline de días */}
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {row.cells.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center min-w-[3rem]"
                      title={`${c.date}: ${c.done ? (c.value ?? t('common.completed')) : 'No ' + t('common.completed').toLowerCase()}`}
                    >
                      <span className="text-xs text-gray-500 mb-1">{c.label}</span>
                      <div
                        className={`h-10 w-10 rounded-lg border-2 flex items-center justify-center text-xs font-medium
                        ${c.done 
                          ? 'bg-emerald-500 text-white border-emerald-500' 
                          : 'bg-gray-50 text-gray-400 border-gray-300'
                        }`}
                      >
                        {c.done ? (typeof c.value === 'number' ? c.value : '✓') : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}




// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import { listHabits, listLogs, todayISO } from '../lib/storage';
// import type { Habit } from '../lib/storage';
// import { useI18n } from '../lib/i18n';
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   RadarChart,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis,
//   Radar,
// } from 'recharts';

// type DayCell = { date: string; label: string; done: boolean; value?: number };

// function isoDate(d: Date) {
//   return d.toISOString().slice(0, 10);
// }

// function lastNDays(n: number): { date: string; label: string }[] {
//   const out: { date: string; label: string }[] = [];
//   const now = new Date();
//   now.setHours(0, 0, 0, 0);
//   for (let i = n - 1; i >= 0; i--) {
//     const d = new Date(now);
//     d.setDate(now.getDate() - i);
//     const label = d.toLocaleDateString('es', { weekday: 'short' });
//     out.push({ date: isoDate(d), label });
//   }
//   return out;
// }

// function calcStreak(days: DayCell[]): number {
//   let c = 0;
//   for (let i = days.length - 1; i >= 0; i--) {
//     if (days[i].done) c++;
//     else break;
//   }
//   return c;
// }

// export default function DashboardPage() {
//   const { t } = useI18n();
//   const [habits, setHabits] = useState<Habit[]>([]);
//   const [period, setPeriod] = useState<7 | 14 | 30>(7);
//   const [ready, setReady] = useState(false);

//   useEffect(() => {
//     setHabits(listHabits());
//     setReady(true);
//   }, []);

//   const logs = useMemo(() => listLogs(), [ready]);
//   const days = useMemo(() => lastNDays(period), [period]);

//   const rows = useMemo(() => {
//     return habits.map((h) => {
//       const cells: DayCell[] = days.map((d) => {
//         const log = logs.find((l) => l.habitId === h.id && l.date === d.date);
//         const done = h.type === 'check' ? Boolean(log?.done) : (typeof log?.value === 'number' && log.value > 0);
//         const value = typeof log?.value === 'number' ? log!.value : undefined;
//         return { date: d.date, label: d.label, done, value };
//       });

//       const hits = cells.filter((c) => c.done).length;
//       const pct = Math.min(100, Math.round((hits / Math.max(1, h.goalPerWeek)) * 100));
//       const sum = cells.reduce((acc, c) => acc + (c.value ?? 0), 0);
//       const streak = calcStreak(cells);

//       return { habit: h, cells, hits, pct, sum, streak };
//     });
//   }, [habits, logs, days]);

//   // Datos para gráfico de barras (actividad por día)
//   const activityByDay = useMemo(() => {
//     return days.map(day => ({
//       date: day.label,
//       completados: logs.filter(l => l.date === day.date).length,
//     }));
//   }, [days, logs]);

//   // Datos para gráfico de líneas (progreso acumulado)
//   const cumulativeProgress = useMemo(() => {
//     let cumulative = 0;
//     return days.map(day => {
//       const dayLogs = logs.filter(l => l.date === day.date).length;
//       cumulative += dayLogs;
//       return {
//         date: day.label,
//         total: cumulative,
//       };
//     });
//   }, [days, logs]);

//   // Datos para radar (cumplimiento por hábito)
//   const radarData = useMemo(() => {
//     return rows.slice(0, 6).map(row => ({
//       habit: row.habit.title.slice(0, 15) + (row.habit.title.length > 15 ? '...' : ''),
//       cumplimiento: row.pct,
//     }));
//   }, [rows]);

//   // Estadísticas generales
//   const stats = useMemo(() => {
//     const totalHabits = habits.length;
//     const totalLogs = logs.length;
//     const avgCompletion = rows.length > 0
//       ? Math.round(rows.reduce((sum, r) => sum + r.pct, 0) / rows.length)
//       : 0;
//     const bestStreak = rows.length > 0
//       ? Math.max(...rows.map(r => r.streak))
//       : 0;

//     return { totalHabits, totalLogs, avgCompletion, bestStreak };
//   }, [habits, logs, rows]);

//   if (!ready) return null;

//   return (
//     <main className="py-4">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
//           <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
//         </div>
        
//         {/* Selector de período */}
//         <div className="flex gap-2">
//           {[7, 14, 30].map(n => (
//             <button
//               key={n}
//               onClick={() => setPeriod(n as 7 | 14 | 30)}
//               className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
//                 period === n
//                   ? 'bg-indigo-600 text-white'
//                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//               }`}
//             >
//               {n} {t('dashboard.days')}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Estadísticas generales */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
//           <p className="text-sm text-indigo-700 font-medium">{t('dashboard.activeHabits')}</p>
//           <p className="text-3xl font-bold text-indigo-900 mt-1">{stats.totalHabits}</p>
//         </div>
//         <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
//           <p className="text-sm text-green-700 font-medium">{t('dashboard.totalRecords')}</p>
//           <p className="text-3xl font-bold text-green-900 mt-1">{stats.totalLogs}</p>
//         </div>
//         <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
//           <p className="text-sm text-blue-700 font-medium">{t('dashboard.avgCompletion')}</p>
//           <p className="text-3xl font-bold text-blue-900 mt-1">{stats.avgCompletion}%</p>
//         </div>
//         <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
//           <p className="text-sm text-yellow-700 font-medium">{t('dashboard.bestStreak')}</p>
//           <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.bestStreak} 🔥</p>
//         </div>
//       </div>

//       {/* Gráficos */}
//       {habits.length === 0 ? (
//         <div className="text-center py-12 bg-white border-2 border-dashed border-gray-300 rounded-xl">
//           <div className="text-6xl mb-4">📊</div>
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">
//             {t('dashboard.noData')}
//           </h3>
//           <p className="text-gray-600">
//             {t('dashboard.noDataDesc')}
//           </p>
//         </div>
//       ) : (
//         <div className="grid gap-6">
//           {/* Gráfico de barras - Actividad diaria */}
//           <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
//             <h3 className="text-lg font-semibold mb-4">{t('dashboard.dailyActivity')}</h3>
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={activityByDay}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Bar dataKey="completados" fill="#8b5cf6" name={t('dashboard.habitsCompleted')} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Gráfico de líneas - Progreso acumulado */}
//           <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
//             <h3 className="text-lg font-semibold mb-4">{t('dashboard.cumulativeProgress')}</h3>
//             <ResponsiveContainer width="100%" height={300}>
//               <LineChart data={cumulativeProgress}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Line
//                   type="monotone"
//                   dataKey="total"
//                   stroke="#10b981"
//                   strokeWidth={3}
//                   name={t('dashboard.totalRecordsChart')}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Radar - Cumplimiento por hábito */}
//           {radarData.length > 0 && (
//             <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
//               <h3 className="text-lg font-semibold mb-4">{t('dashboard.habitCompletion')}</h3>
//               <ResponsiveContainer width="100%" height={300}>
//                 <RadarChart data={radarData}>
//                   <PolarGrid />
//                   <PolarAngleAxis dataKey="habit" />
//                   <PolarRadiusAxis angle={90} domain={[0, 100]} />
//                   <Radar
//                     name={t('dashboard.completionPercent')}
//                     dataKey="cumplimiento"
//                     stroke="#3b82f6"
//                     fill="#3b82f6"
//                     fillOpacity={0.6}
//                   />
//                   <Tooltip />
//                   <Legend />
//                 </RadarChart>
//               </ResponsiveContainer>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Detalle por hábito */}
//       {habits.length > 0 && (
//         <div className="mt-8">
//           <h2 className="text-xl font-semibold mb-4">{t('dashboard.habitDetail')}</h2>
//           <div className="grid gap-4">
//             {rows.map((row) => (
//               <section key={row.habit.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
//                 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900">{row.habit.title}</h3>
//                     <p className="text-sm text-gray-500 mt-1">
//                       {t('habits.goal')}: {row.habit.goalPerWeek}/{t('common.week')} · {t('dashboard.habitType')}:{' '}
//                       {row.habit.type === 'check' ? t('dashboard.checkHabit') : t('dashboard.quantityHabit')}
//                     </p>
//                   </div>
//                   <div className="flex flex-col items-end gap-2">
//                     <div className="flex items-center gap-4">
//                       <div className="text-right">
//                         <p className="text-sm text-gray-600">{t('dashboard.progress')}</p>
//                         <p className="text-xl font-bold text-gray-900">
//                           {row.hits}/{row.habit.goalPerWeek}
//                         </p>
//                       </div>
//                       <div className="text-right">
//                         <p className="text-sm text-gray-600">{t('habits.streak')}</p>
//                         <p className="text-xl font-bold text-orange-600">
//                           {row.streak} 🔥
//                         </p>
//                       </div>
//                     </div>
//                     <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
//                       <div
//                         className="h-full bg-indigo-600"
//                         style={{ width: `${row.pct}%` }}
//                       />
//                     </div>
//                     {row.habit.type === 'number' && (
//                       <p className="text-sm text-gray-600">
//                         {t('habits.totalPeriod')}: {row.sum}
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 {/* Timeline de días */}
//                 <div className="flex gap-1 overflow-x-auto pb-2">
//                   {row.cells.map((c, idx) => (
//                     <div
//                       key={idx}
//                       className="flex flex-col items-center min-w-[3rem]"
//                       title={`${c.date}: ${c.done ? (c.value ?? t('common.completed')) : 'No ' + t('common.completed').toLowerCase()}`}
//                     >
//                       <span className="text-xs text-gray-500 mb-1">{c.label}</span>
//                       <div
//                         className={`h-10 w-10 rounded-lg border-2 flex items-center justify-center text-xs font-medium
//                         ${c.done 
//                           ? 'bg-emerald-500 text-white border-emerald-500' 
//                           : 'bg-gray-50 text-gray-400 border-gray-300'
//                         }`}
//                       >
//                         {c.done ? (typeof c.value === 'number' ? c.value : '✓') : '—'}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </section>
//             ))}
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }


