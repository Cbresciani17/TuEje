// app/components/FinanceCharts.tsx
'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { type Transaction } from '../lib/storage';
import { useI18n } from '../lib/i18n';

type Props = {
  transactions: Transaction[];
  period: 'month' | '3months' | 'year' | 'all';
};

const COLORS = [
  '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#ef4444', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

export default function FinanceCharts({ transactions, period }: Props) {
  const { t } = useI18n();

  // Filtrar transacciones según período
  const filteredTransactions = useMemo(() => {
    if (period === 'all') return transactions;

    const now = new Date();
    const cutoff = new Date();

    if (period === 'month') {
      cutoff.setMonth(now.getMonth() - 1);
    } else if (period === '3months') {
      cutoff.setMonth(now.getMonth() - 3);
    } else if (period === 'year') {
      cutoff.setFullYear(now.getFullYear() - 1);
    }

    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, period]);

  // Datos para gráfico de pastel (gastos por categoría)
  const expensesByCategory = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, t) => {
      const key = t.category;
      acc[key] = (acc[key] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([category, amount]) => ({
        name: t(`finance.categories.${category}`),
        value: amount,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, t]);

  // Datos para gráfico de barras (ingresos vs gastos por mes)
  const monthlyComparison = useMemo(() => {
    const grouped = filteredTransactions.reduce((acc, t) => {
      const month = t.date.slice(0, 7); // yyyy-mm
      if (!acc[month]) {
        acc[month] = { month, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        acc[month].income += t.amount;
      } else {
        acc[month].expense += t.amount;
      }
      return acc;
    }, {} as Record<string, { month: string; income: number; expense: number }>);

    return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions]);

  // Datos para gráfico de líneas (balance acumulado)
  const balanceOverTime = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));
    let balance = 0;
    
    return sorted.map(t => {
      balance += t.type === 'income' ? t.amount : -t.amount;
      return {
        date: t.date,
        balance,
      };
    });
  }, [filteredTransactions]);

  if (filteredTransactions.length === 0) {
    return (
      <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-8 text-center">
        {t('finance.noDataPeriod')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Pastel - Gastos por categoría */}
      {expensesByCategory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{t('finance.charts.expensesByCategory')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                // FIX FINAL: Usar 'any' para el parámetro para ignorar el conflicto de tipo PieLabelRenderProps
                label={({ name, percent }: any) => 
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expensesByCategory.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de Barras - Ingresos vs Gastos */}
      {monthlyComparison.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{t('finance.charts.incomeVsExpense')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name={t('finance.income')} />
              <Bar dataKey="expense" fill="#ef4444" name={t('finance.expenses')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de Líneas - Balance acumulado */}
      {balanceOverTime.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{t('finance.charts.cumulativeBalance')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={balanceOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#8b5cf6"
                strokeWidth={2}
                name={t('finance.balance')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla de top gastos */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">{t('finance.charts.topCategories')}</h3>
        <div className="space-y-2">
          {expensesByCategory.slice(0, 5).map((cat, index) => (
            <div key={cat.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-700">{cat.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                ${cat.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
