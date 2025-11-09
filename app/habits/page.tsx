
'use client';

import { useEffect, useMemo, useState } from 'react';
import HabitCard from '../components/HabitCard';
import type { Habit } from '../lib/storage';
import { deleteHabit, listHabits, saveHabit, uid } from '../lib/storage';

type FormState = {
  title: string;
  goalPerWeek: number;
  type: 'check' | 'number';
};

export default function HabitsPage() {
  const [form, setForm] = useState<FormState>({ title: '', goalPerWeek: 3, type: 'check' });
  const [habits, setHabits] = useState<Habit[]>([]);

  // cargar al montar
  useEffect(() => {
    setHabits(listHabits());
  }, []);

  // guardar nuevo hábito
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return alert('Escribe un título');

    const h: Habit = {
      id: uid(),
      title: form.title.trim(),
      goalPerWeek: Number(form.goalPerWeek) || 1,
      type: form.type,
      createdAt: new Date().toISOString(),
    };
    saveHabit(h);
    setHabits(prev => [h, ...prev]);
    setForm({ title: '', goalPerWeek: 3, type: 'check' });
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este hábito?')) return;
    deleteHabit(id);
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const empty = useMemo(() => habits.length === 0, [habits]);

  return (
    <main className="py-4">
      <h1 className="text-2xl font-semibold">Hábitos</h1>
      <p className="text-gray-600 mt-1">Crea hábitos y registra tu progreso diario.</p>

      {/* Formulario de creación */}
      <form onSubmit={handleCreate} className="mt-4 grid gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Dormir 7h, Estudiar 1h, etc."
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Meta semanal</label>
            <input
              type="number"
              min={1}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={form.goalPerWeek}
              onChange={(e) => setForm(f => ({ ...f, goalPerWeek: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              value={form.type}
              onChange={(e) => setForm(f => ({ ...f, type: e.target.value as 'check' | 'number' }))}
            >
              <option value="check">Hábito (hecho / no hecho)</option>
              <option value="number">Cantidad (horas / minutos / km)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition"
          >
            Crear
          </button>
        </div>
      </form>

      {/* Lista de hábitos */}
      <div className="mt-6 grid gap-4">
        {empty ? (
          <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-4">
            Aún no tienes hábitos. Crea uno arriba para empezar.
          </div>
        ) : (
          habits.map(h => (
            <div key={h.id} className="relative">
              <HabitCard habit={h} />
              <button
                onClick={() => handleDelete(h.id)}
                className="absolute top-3 right-3 text-xs text-red-600 hover:underline"
                title="Eliminar hábito"
              >
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
