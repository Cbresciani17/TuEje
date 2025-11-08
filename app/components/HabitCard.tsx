'use client';

import { useEffect, useState } from 'react';
import type { Habit } from '../lib/storage';
import { listLogs, saveLog, todayISO } from '../lib/storage';

export default function HabitCard({ habit }: { habit: Habit }) {
  const [value, setValue] = useState<number>(0);
  const [doneToday, setDoneToday] = useState<boolean>(false);
  const [valueToday, setValueToday] = useState<number | null>(null);

  const date = todayISO();

  // Al montar: revisar si ya existe log para hoy
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
      alert('Registro guardado ✅');
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
    alert('Registro guardado ✅');
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{habit.title}</h3>
        <span className="text-xs text-gray-500">Meta: {habit.goalPerWeek}/sem</span>
      </div>

      <p className="mt-1 text-xs text-gray-500">
        Tipo: {habit.type === 'check' ? 'Hábito (hecho/no hecho)' : 'Cantidad (número)'}
      </p>

      <div className="mt-4 flex items-center gap-3">
        {habit.type === 'check' ? (
          <>
            <button
              onClick={handleLog}
              disabled={doneToday}
              className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                doneToday ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              Registrar hoy
            </button>
            {doneToday && <span className="text-sm text-green-600">✔ Ya registraste hoy</span>}
          </>
        ) : (
          <>
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              placeholder="Horas / km / cantidad"
              className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
            <button
              onClick={handleLog}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
            >
              Registrar hoy
            </button>
            {valueToday !== null && (
              <span className="text-sm text-green-600">✔ Registrado hoy: {valueToday}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
