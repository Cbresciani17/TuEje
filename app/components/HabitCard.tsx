'use client';

import { useEffect, useState } from 'react';
import type { Habit } from '../lib/storage';
import { listLogs, saveLog, todayISO } from '../lib/storage';

export default function HabitCard({ habit }: { habit: Habit }) {
  const [value, setValue] = useState<number>(0);
  const [doneToday, setDoneToday] = useState<boolean>(false);
  const [valueToday, setValueToday] = useState<number | null>(null);

  const date = todayISO();

  useEffect(() => {
    const logs = listLogs();
    const today = logs.find(l => l.habitId === habit.id && l.date === date);
    if (today) {
      if (habit.type === 'check') {
        setDoneToday(Boolean(today.done));
      } else {
        setValueToday(typeof today.value === 'number' ? today.value : null);
      }
    }
  }, [habit.id, habit.type, date]);

  const handleLog = () => {
    if (habit.type === 'check') {
      saveLog({ id: `${habit.id}-${date}`, habitId: habit.id, date, done: true });
      setDoneToday(true);
      return;
    }

    const v = Number(value) || 0;
    if (v <= 0) {
      alert('Ingresa un número mayor que 0');
      return;
    }
    saveLog({ id: `${habit.id}-${date}`, habitId: habit.id, date, value: v });
    setValue(0);
    setValueToday(v);
  };

  return (
    <div className="border-2 border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{habit.title}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
              Meta: {habit.goalPerWeek}/semana
            </span>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {habit.type === 'check' ? '✅ Hecho/No hecho' : '🔢 Cantidad'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        {habit.type === 'check' ? (
          <>
            <button
              onClick={handleLog}
              disabled={doneToday}
              className={`flex-1 px-5 py-3 rounded-lg text-white font-medium transition shadow-sm ${
                doneToday 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow'
              }`}
            >
              {doneToday ? '✅ Completado' : '📝 Registrar hoy'}
            </button>
            {doneToday && (
              <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <span className="text-xl">🎉</span>
                <span>¡Bien hecho!</span>
              </div>
            )}
          </>
        ) : (
          <>
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              placeholder="Cantidad"
              className="w-32 px-3 py-3 border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleLog}
              className="flex-1 px-5 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-sm hover:shadow"
            >
              📝 Registrar
            </button>
            {valueToday !== null && (
              <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <span className="text-xl">✅</span>
                <span>{valueToday}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


