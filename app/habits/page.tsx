// app/habits/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import HabitCard from '../components/HabitCard';
import type { Habit } from '../lib/storage';
import { deleteHabit, listHabits, listLogs, saveHabit, todayISO, uid } from '../lib/storage';
import { AUTH_EVENT } from '../lib/auth';
import { useI18n } from '../lib/i18n';

type FormState = {
  title: string;
  goalPerWeek: number;
  type: 'check' | 'number';
};

export default function HabitsPage() {
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>({ title: '', goalPerWeek: 3, type: 'check' });
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(() => {
    setHabits(listHabits());
    setLogs(listLogs());
  }, []);

  useEffect(() => {
    refresh();
    
    const onDataChanged = () => refresh();

    window.addEventListener(AUTH_EVENT, onDataChanged);
    window.addEventListener('storage', onDataChanged);
    window.addEventListener('focus', onDataChanged);

    return () => {
      window.removeEventListener(AUTH_EVENT, onDataChanged);
      window.removeEventListener('storage', onDataChanged);
      window.removeEventListener('focus', onDataChanged);
    };
  }, [refresh]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return alert(t('habits.habitTitle'));

    const h: Habit = {
      id: uid(),
      title: form.title.trim(),
      goalPerWeek: Number(form.goalPerWeek) || 1,
      type: form.type,
      createdAt: new Date().toISOString(),
      // @ts-expect-error: userId lo inyecta storage al persistir
      userId: undefined,
    };
    saveHabit(h);
    
    setForm({ title: '', goalPerWeek: 3, type: 'check' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm(t('habits.deleteConfirm'))) return;
    deleteHabit(id);
  };

  const stats = useMemo(() => {
    const today = todayISO();
    const completedToday = logs.filter((l) => l.date === today).length;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });

    const weeklyLogs = logs.filter((l) => last7Days.includes(l.date));
    const totalPossible = habits.length * 7;
    const weeklyCompletion =
      totalPossible > 0 ? Math.round((weeklyLogs.length / totalPossible) * 100) : 0;

    return {
      total: habits.length,
      completedToday,
      weeklyCompletion,
    };
  }, [habits, logs]);

  return (
    <main className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{t('habits.title')}</h1>
          <p className="text-gray-600 mt-1">{t('habits.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition"
        >
          {showForm ? `✕ ${t('common.cancel')}` : `➕ ${t('habits.newHabit')}`}
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm text-indigo-700 font-medium">{t('habits.stats.total')}</p>
          <p className="text-3xl font-bold text-indigo-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 font-medium">{t('habits.stats.completedToday')}</p>
          <p className="text-3xl font-bold text-green-900 mt-1">{stats.completedToday} ✅</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium">{t('habits.stats.weeklyCompletion')}</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{stats.weeklyCompletion}%</p>
        </div>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 bg-white border-2 border-indigo-200 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">{t('habits.createTitle')}</h3>

          <div className="grid gap-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('habits.habitTitle')}
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={t('habits.habitPlaceholder')}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Meta semanal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('habits.weeklyGoal')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={form.goalPerWeek}
                  onChange={(e) => setForm((f) => ({ ...f, goalPerWeek: Number(e.target.value) }))}
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('habits.recordType')}
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value as 'check' | 'number' }))
                  }
                >
                  <option value="check">{t('habits.checkType')}</option>
                  <option value="number">{t('habits.numberType')}</option>
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
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition"
              >
                {t('habits.createButton')}
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
              {t('habits.noHabits')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('habits.noHabitsDesc')}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition"
            >
              {t('habits.createFirst')}
            </button>
          </div>
        ) : (
          habits.map((h) => (
            <div key={h.id} className="relative">
              <HabitCard habit={h} /> 
              <button
                onClick={() => handleDelete(h.id)}
                className="absolute top-4 right-4 text-xs text-red-600 hover:text-red-700 hover:underline font-medium"
                title={t('common.delete')}
              >
                🗑️ {t('common.delete')}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Mensaje motivacional */}
      {habits.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
          <p className="text-sm text-indigo-900 font-medium">
            {t('habits.motivation')}
          </p>
          <p className="text-sm text-indigo-700 mt-1">
            {t('habits.motivationDesc')}
          </p>
        </div>
      )}
    </main>
  );
}



