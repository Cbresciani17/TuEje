
// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <section className="mt-6">
      <h1 className="text-2xl font-semibold mb-2">Bienvenido/a a TuEje</h1>
      <p className="text-gray-600 mb-6">
        Elige una sección para comenzar. Puedes cambiar el idioma desde la barra superior.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/habits"
          className="rounded-xl border p-5 bg-white hover:shadow transition"
        >
          <h2 className="font-semibold text-lg mb-1">Hábitos</h2>
          <p className="text-sm text-gray-600">
            Crea hábitos y registra tu progreso diario.
          </p>
        </Link>

        <Link
          href="/finance"
          className="rounded-xl border p-5 bg-white hover:shadow transition"
        >
          <h2 className="font-semibold text-lg mb-1">Finanzas</h2>
          <p className="text-sm text-gray-600">
            Control simple de movimientos y métricas personales.
          </p>
        </Link>

        <Link
          href="/dashboard"
          className="rounded-xl border p-5 bg-white hover:shadow transition"
        >
          <h2 className="font-semibold text-lg mb-1">Dashboard</h2>
          <p className="text-sm text-gray-600">
            Resumen de la semana y gráficos de avance.
          </p>
        </Link>
      </div>
    </section>
  );
}
