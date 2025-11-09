'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  deleteTransaction,
  EXPENSE_CATEGORIES,
  getCategoryLabel,
  INCOME_CATEGORIES,
  listTransactions,
  saveTransaction,
  todayISO,
  uid,
  type Transaction,
  type TransactionCategory,
  type TransactionType,
} from '../lib/storage';
import FinanceCharts from '../components/FinanceCharts';

type FormState = {
  type: TransactionType;
  category: TransactionCategory;
  amount: string;
  description: string;
  date: string;
};

type Period = 'month' | '3months' | 'year' | 'all';

export default function FinancePage() {
  const [form, setForm] = useState<FormState>({
    type: 'expense',
    category: 'food',
    amount: '',
    description: '',
    date: todayISO(),
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [period, setPeriod] = useState<Period>('month');
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    setTransactions(listTransactions());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      return alert('Ingresa un monto válido');
    }

    const transaction: Transaction = {
      id: uid(),
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      description: form.description.trim(),
      date: form.date,
      createdAt: new Date().toISOString(),
    };

    saveTransaction(transaction);
    setTransactions(prev => [transaction, ...prev]);
    setForm({
      type: 'expense',
      category: 'food',
      amount: '',
      description: '',
      date: todayISO(),
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleTypeChange = (type: TransactionType) => {
    setForm(f => ({
      ...f,
      type,
      category: type === 'income' ? 'salary' : 'food',
    }));
  };

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type === filter);
  }, [transactions, filter]);

  const summary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  return (
    <main className="py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finanzas</h1>
          <p className="text-gray-600 mt-1">Registra tus ingresos y gastos.</p>
        </div>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200 transition"
        >
          {showCharts ? '📋 Ver Lista' : '📊 Ver Gráficos'}
        </button>
      </div>

      {/* Resumen */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 font-medium">Ingresos</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            ${summary.income.toLocaleString()}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 font-medium">Gastos</p>
          <p className="text-2xl font-bold text-red-900 mt-1">
            ${summary.expense.toLocaleString()}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium">Balance</p>
          <p className={`text-2xl font-bold mt-1 ${summary.balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
            ${summary.balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="mt-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="grid gap-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  form.type === 'income'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💰 Ingreso
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  form.type === 'expense'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💸 Gasto
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as TransactionCategory }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ej: Supermercado, taxi, etc."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition"
            >
              ➕ Agregar transacción
            </button>
          </div>
        </div>
      </form>

      {/* Toggle entre Gráficos y Lista */}
      {showCharts ? (
        <>
          {/* Selector de período */}
          <div className="mt-6 flex gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 self-center">Período:</span>
            {(['month', '3months', 'year', 'all'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  period === p
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'month' && 'Último mes'}
                {p === '3months' && 'Últimos 3 meses'}
                {p === 'year' && 'Último año'}
                {p === 'all' && 'Todo'}
              </button>
            ))}
          </div>

          {/* Gráficos */}
          <div className="mt-6">
            <FinanceCharts transactions={transactions} period={period} />
          </div>
        </>
      ) : (
        <>
          {/* Filtros */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('income')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Ingresos
            </button>
            <button
              onClick={() => setFilter('expense')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💸 Gastos
            </button>
          </div>

          {/* Lista de transacciones */}
          <div className="mt-4 space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-4">
                No hay transacciones registradas.
              </div>
            ) : (
              filteredTransactions.map(t => (
                <div
                  key={t.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          t.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {getCategoryLabel(t.category)}
                      </span>
                      <span className="text-sm text-gray-500">{t.date}</span>
                    </div>
                    {t.description && (
                      <p className="text-sm text-gray-700 mt-1">{t.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg font-bold ${
                        t.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-xs text-red-600 hover:underline"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}




// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import {
//   deleteTransaction,
//   EXPENSE_CATEGORIES,
//   getCategoryLabel,
//   INCOME_CATEGORIES,
//   listTransactions,
//   saveTransaction,
//   todayISO,
//   uid,
//   type Transaction,
//   type TransactionCategory,
//   type TransactionType,
// } from '../lib/storage';

// type FormState = {
//   type: TransactionType;
//   category: TransactionCategory;
//   amount: string;
//   description: string;
//   date: string;
// };

// export default function FinancePage() {
//   const [form, setForm] = useState<FormState>({
//     type: 'expense',
//     category: 'food',
//     amount: '',
//     description: '',
//     date: todayISO(),
//   });

//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

//   useEffect(() => {
//     setTransactions(listTransactions());
//   }, []);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!form.amount || Number(form.amount) <= 0) {
//       return alert('Ingresa un monto válido');
//     }

//     const transaction: Transaction = {
//       id: uid(),
//       type: form.type,
//       category: form.category,
//       amount: Number(form.amount),
//       description: form.description.trim(),
//       date: form.date,
//       createdAt: new Date().toISOString(),
//     };

//     saveTransaction(transaction);
//     setTransactions(prev => [transaction, ...prev]);
//     setForm({
//       type: 'expense',
//       category: 'food',
//       amount: '',
//       description: '',
//       date: todayISO(),
//     });
//   };

//   const handleDelete = (id: string) => {
//     if (!confirm('¿Eliminar esta transacción?')) return;
//     deleteTransaction(id);
//     setTransactions(prev => prev.filter(t => t.id !== id));
//   };

//   const handleTypeChange = (type: TransactionType) => {
//     setForm(f => ({
//       ...f,
//       type,
//       category: type === 'income' ? 'salary' : 'food',
//     }));
//   };

//   const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

//   const filteredTransactions = useMemo(() => {
//     if (filter === 'all') return transactions;
//     return transactions.filter(t => t.type === filter);
//   }, [transactions, filter]);

//   const summary = useMemo(() => {
//     const income = transactions
//       .filter(t => t.type === 'income')
//       .reduce((sum, t) => sum + t.amount, 0);
//     const expense = transactions
//       .filter(t => t.type === 'expense')
//       .reduce((sum, t) => sum + t.amount, 0);
//     return { income, expense, balance: income - expense };
//   }, [transactions]);

//   return (
//     <main className="py-4">
//       <h1 className="text-2xl font-semibold">Finanzas</h1>
//       <p className="text-gray-600 mt-1">Registra tus ingresos y gastos.</p>

//       {/* Resumen */}
//       <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
//         <div className="bg-green-50 border border-green-200 rounded-xl p-4">
//           <p className="text-sm text-green-700 font-medium">Ingresos</p>
//           <p className="text-2xl font-bold text-green-900 mt-1">
//             ${summary.income.toLocaleString()}
//           </p>
//         </div>
//         <div className="bg-red-50 border border-red-200 rounded-xl p-4">
//           <p className="text-sm text-red-700 font-medium">Gastos</p>
//           <p className="text-2xl font-bold text-red-900 mt-1">
//             ${summary.expense.toLocaleString()}
//           </p>
//         </div>
//         <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
//           <p className="text-sm text-blue-700 font-medium">Balance</p>
//           <p className={`text-2xl font-bold mt-1 ${summary.balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
//             ${summary.balance.toLocaleString()}
//           </p>
//         </div>
//       </div>

//       {/* Formulario */}
//       <form onSubmit={handleSubmit} className="mt-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
//         <div className="grid gap-4">
//           {/* Tipo */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
//             <div className="flex gap-2">
//               <button
//                 type="button"
//                 onClick={() => handleTypeChange('income')}
//                 className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
//                   form.type === 'income'
//                     ? 'bg-green-600 text-white'
//                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                 }`}
//               >
//                 Ingreso
//               </button>
//               <button
//                 type="button"
//                 onClick={() => handleTypeChange('expense')}
//                 className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
//                   form.type === 'expense'
//                     ? 'bg-red-600 text-white'
//                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                 }`}
//               >
//                 Gasto
//               </button>
//             </div>
//           </div>

//           <div className="grid sm:grid-cols-2 gap-4">
//             {/* Categoría */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Categoría</label>
//               <select
//                 value={form.category}
//                 onChange={e => setForm(f => ({ ...f, category: e.target.value as TransactionCategory }))}
//                 className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
//               >
//                 {categories.map(cat => (
//                   <option key={cat.value} value={cat.value}>
//                     {cat.label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Monto */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Monto</label>
//               <input
//                 type="number"
//                 min="0"
//                 step="0.01"
//                 value={form.amount}
//                 onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
//                 placeholder="0.00"
//                 className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
//               />
//             </div>
//           </div>

//           <div className="grid sm:grid-cols-2 gap-4">
//             {/* Descripción */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Descripción</label>
//               <input
//                 type="text"
//                 value={form.description}
//                 onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
//                 placeholder="Ej: Supermercado, taxi, etc."
//                 className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
//               />
//             </div>

//             {/* Fecha */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Fecha</label>
//               <input
//                 type="date"
//                 value={form.date}
//                 onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
//                 className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
//               />
//             </div>
//           </div>

//           <div className="flex justify-end">
//             <button
//               type="submit"
//               className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition"
//             >
//               Agregar transacción
//             </button>
//           </div>
//         </div>
//       </form>

//       {/* Filtros */}
//       <div className="mt-6 flex gap-2">
//         <button
//           onClick={() => setFilter('all')}
//           className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
//             filter === 'all'
//               ? 'bg-indigo-600 text-white'
//               : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//           }`}
//         >
//           Todas
//         </button>
//         <button
//           onClick={() => setFilter('income')}
//           className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
//             filter === 'income'
//               ? 'bg-green-600 text-white'
//               : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//           }`}
//         >
//           Ingresos
//         </button>
//         <button
//           onClick={() => setFilter('expense')}
//           className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
//             filter === 'expense'
//               ? 'bg-red-600 text-white'
//               : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//           }`}
//         >
//           Gastos
//         </button>
//       </div>

//       {/* Lista de transacciones */}
//       <div className="mt-4 space-y-2">
//         {filteredTransactions.length === 0 ? (
//           <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-4">
//             No hay transacciones registradas.
//           </div>
//         ) : (
//           filteredTransactions.map(t => (
//             <div
//               key={t.id}
//               className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between"
//             >
//               <div className="flex-1">
//                 <div className="flex items-center gap-2">
//                   <span
//                     className={`px-2 py-1 rounded text-xs font-medium ${
//                       t.type === 'income'
//                         ? 'bg-green-100 text-green-800'
//                         : 'bg-red-100 text-red-800'
//                     }`}
//                   >
//                     {getCategoryLabel(t.category)}
//                   </span>
//                   <span className="text-sm text-gray-500">{t.date}</span>
//                 </div>
//                 {t.description && (
//                   <p className="text-sm text-gray-700 mt-1">{t.description}</p>
//                 )}
//               </div>
//               <div className="flex items-center gap-3">
//                 <span
//                   className={`text-lg font-bold ${
//                     t.type === 'income' ? 'text-green-600' : 'text-red-600'
//                   }`}
//                 >
//                   {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
//                 </span>
//                 <button
//                   onClick={() => handleDelete(t.id)}
//                   className="text-xs text-red-600 hover:underline"
//                   title="Eliminar"
//                 >
//                   Eliminar
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </main>
//   );
// }





// // export default function FinancePage() {
// //   return (
// //     <main className="p-6">
// //       <h1 className="text-2xl font-semibold">Finanzas</h1>
// //       <p className="text-gray-600 mt-2">Aquí cargaremos transacciones y metas.</p>
// //     </main>
// //   );
// // }
