'use client';

import { useEffect, useMemo, useState } from 'react';
import HabitCard from '../components/HabitCard';
import type { Habit } from '../lib/storage';
import { deleteHabit, listHabits, listLogs, saveHabit, todayISO, uid } from '../lib/storage';

type FormState = {
  title: string;
  goalPerWeek: number;
  type: 'check' | 'number';
};

export default function HabitsPage() {
  const [form, setForm] = useState<FormState>({ title: '', goalPerWeek: 3, type: 'check' });
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setHabits(listHabits());
  }, []);

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
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este hábito y todos sus registros?')) return;
    deleteHabit(id);
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // Estadísticas
  const stats = useMemo(() => {
    const logs = listLogs();
    const today = todayISO();
    const completedToday = logs.filter(l => l.date === today).length;
    
    // Calcular promedio de cumplimiento semanal
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });
    
    const weeklyLogs = logs.filter(l => last7Days.includes(l.date));
    const totalPossible = habits.length * 7;
    const weeklyCompletion = totalPossible > 0 
      ? Math.round((weeklyLogs.length / totalPossible) * 100)
      : 0;

    return {
      total: habits.length,
      completedToday,
      weeklyCompletion,
    };
  }, [habits]);

  return (
    <main className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Hábitos</h1>
          <p className="text-gray-600 mt-1">Construye mejores rutinas día a día</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition"
        >
          {showForm ? '✕ Cancelar' : '➕ Nuevo hábito'}
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm text-indigo-700 font-medium">Total de hábitos</p>
          <p className="text-3xl font-bold text-indigo-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 font-medium">Completados hoy</p>
          <p className="text-3xl font-bold text-green-900 mt-1">{stats.completedToday} ✅</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium">Cumplimiento semanal</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{stats.weeklyCompletion}%</p>
        </div>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 bg-white border-2 border-indigo-200 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Crear nuevo hábito</h3>
          
          <div className="grid gap-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del hábito
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej: Hacer ejercicio, leer 30 min, meditar..."
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Meta semanal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta semanal (veces)
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={form.goalPerWeek}
                  onChange={(e) => setForm(f => ({ ...f, goalPerWeek: Number(e.target.value) }))}
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de registro
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  value={form.type}
                  onChange={(e) => setForm(f => ({ ...f, type: e.target.value as 'check' | 'number' }))}
                >
                  <option value="check">✅ Hecho / No hecho</option>
                  <option value="number">🔢 Cantidad (horas, km, etc.)</option>
                </select>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition"
              >
                ✨ Crear hábito
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Lista de hábitos */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="text-center py-12 bg-white border-2 border-dashed border-gray-300 rounded-xl">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aún no tienes hábitos
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primer hábito para empezar a construir mejores rutinas
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition"
            >
              ➕ Crear mi primer hábito
            </button>
          </div>
        ) : (
          habits.map(h => (
            <div key={h.id} className="relative">
              <HabitCard habit={h} />
              <button
                onClick={() => handleDelete(h.id)}
                className="absolute top-4 right-4 text-xs text-red-600 hover:text-red-700 hover:underline font-medium"
                title="Eliminar hábito"
              >
                🗑️ Eliminar
              </button>
            </div>
          ))
        )}
      </div>

      {/* Mensaje motivacional */}
      {habits.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
          <p className="text-sm text-indigo-900 font-medium">
            💪 ¡Sigue así! La constancia es la clave del éxito.
          </p>
          <p className="text-sm text-indigo-700 mt-1">
            Cada día que completes tus hábitos estarás un paso más cerca de tus metas.
          </p>
        </div>
      )}
    </main>
  );
}



