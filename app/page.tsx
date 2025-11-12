"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listHabits, listLogs, listTransactions, todayISO } from "./lib/storage"; 
import { AUTH_EVENT } from "./lib/auth";

export default function HomePage() {
  const [stats, setStats] = useState({
    habitsTotal: 0,
    habitsCompletedToday: 0,
    transactionsTotal: 0,
    currentBalance: 0,
    weekStreak: 0,
  });

  const calculateStats = () => {
    // Lee siempre filtrado por el usuario actual (lo hace storage.ts)
    const habits = listHabits();
    const logs = listLogs(); // Necesitas logs para la racha y completados hoy
    const transactions = listTransactions();
    const today = todayISO();

    // 1. Hábitos completados hoy
    const todayLogs = logs.filter(l => l.date === today);
    const habitsCompletedToday = todayLogs.length;

    // 2. Balance actual
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = income - expense;
    
    const transactionsTotal = transactions.length;

    // 3. Calcular racha de la semana (días con al menos 1 hábito completado)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });
    
    const daysWithActivity = last7Days.filter(date => 
      logs.some(l => l.date === date)
    ).length;

    setStats({
      habitsTotal: habits.length,
      habitsCompletedToday,
      transactionsTotal,
      currentBalance,
      weekStreak: daysWithActivity,
    });
  };

  useEffect(() => {
    // primera carga
    calculateStats();

    // 🔔 escuchar cambios de sesión propios y de otras pestañas (como en tu código)
    const onAuth = () => calculateStats();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("tueje_")) calculateStats();
    };
    const onFocus = () => calculateStats();

    window.addEventListener(AUTH_EVENT, onAuth);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener(AUTH_EVENT, onAuth);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // 💡 Lógica para mostrar el balance con signo
  const formatBalance = (balance: number) => {
      const sign = balance < 0 ? '-' : '';
      return `${sign}$${Math.abs(balance).toLocaleString()}`;
  };

  const features = [
    {
      title: 'Hábitos',
      icon: '✅',
      description: 'Crea y rastrea tus hábitos diarios',
      stats: `${stats.habitsCompletedToday}/${stats.habitsTotal} completados hoy`,
      link: '/habits',
      color: 'indigo',
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      title: 'Finanzas',
      icon: '💰',
      description: 'Control de ingresos y gastos',
      // Aplicar formato para el stat de la tarjeta de feature
      stats: `Balance: ${formatBalance(stats.currentBalance)}`,
      link: '/finance',
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      title: 'Dashboard',
      icon: '📊',
      description: 'Visualiza tu progreso',
      stats: `${stats.weekStreak}/7 días activos`,
      link: '/dashboard',
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-600',
    },
  ];

  return (
    // Usa section para que ocupe todo el espacio disponible
    <section className="min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Hero Section */}
      <div className="text-center py-12 px-4">
        <div className="inline-block mb-4">
          <span className="text-6xl">🎯</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Bienvenido a TuEje
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-2">
          Tu centro de control personal para hábitos y finanzas
        </p>
        <p className="text-sm text-gray-500">
          Organiza tu vida, alcanza tus metas 🚀
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 px-4">
        {/* Tarjeta 1: Hábitos Totales */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm text-indigo-700 font-medium">Hábitos</p>
          <p className="text-3xl font-bold text-indigo-900 mt-1">{stats.habitsTotal}</p>
        </div>
        {/* Tarjeta 2: Racha Semanal */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 font-medium">Racha</p>
          <p className="text-3xl font-bold text-green-900 mt-1">{stats.weekStreak} 🔥</p>
        </div>
        {/* Tarjeta 3: Total Transacciones */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium">Transacciones</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{stats.transactionsTotal}</p>
        </div>
        {/* Tarjeta 4: Balance */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-700 font-medium">Balance</p>
          <p className={`text-3xl font-bold mt-1 ${stats.currentBalance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {/* ✅ FIX: Muestra el signo '-' si es negativo, y luego el valor absoluto */}
            {formatBalance(stats.currentBalance)}
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 mb-8">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.link}
            className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            
            <div className="relative p-6">
              {/* Icon */}
              <div className="text-5xl mb-4">{feature.icon}</div>
              
              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h2>
              
              {/* Description */}
              <p className="text-gray-600 mb-4">
                {feature.description}
              </p>
              
              {/* Stats */}
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800`}>
                {feature.stats} 
              </div>
              
              {/* Arrow */}
              <div className="mt-4 flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                Ir a {feature.title}
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mx-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Consejos rápidos</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            <span>Registra tus hábitos diariamente para mantener tu racha activa</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            <span>Agrega todas tus transacciones para tener control total de tus finanzas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            <span>Revisa tu dashboard semanalmente para analizar tu progreso</span>
          </li>
        </ul>
      </div>

      {/* Footer message */}
      <div className="text-center py-8 px-4 text-sm text-gray-500">
        <p>¡Empieza hoy mismo a construir mejores hábitos! 🌟</p>
      </div>
    </section>
  );
}