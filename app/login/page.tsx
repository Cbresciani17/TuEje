"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Usamos las funciones locales de registro y login
import { login, register, isAuthenticated } from '../lib/auth'; 
// Usamos NextAuth para el SSO
import { signIn } from "next-auth/react"; 

export default function LoginPage() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirigir si la sesión local está activa (antes de que NextAuth cargue)
  useEffect(() => {
    // Nota: Aunque NextAuth es el futuro, mantenemos isAuthenticated()
    // para manejar los usuarios que ya están logueados localmente.
    if (isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  // Lógica original de submit para Login/Register LOCAL
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLoginMode) {
      const result = login(formData.email, formData.password);
      if (result.success) {
        // En login local, redirigimos directamente
        router.push('/');
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } else {
      const result = register(formData.email, formData.password, formData.name);
      if (result.success) {
        // Después de registrar, iniciamos sesión automáticamente
        const loginResult = login(formData.email, formData.password);
        if (loginResult.success) {
          router.push('/');
        }
      } else {
        setError(result.error || 'Error al registrarse');
      }
    }

    setLoading(false);
  };
  
  // Función para Login con Google SSO
  const handleGoogleSignIn = () => {
    // Usamos signIn de NextAuth con callbackUrl
    signIn('google', { callbackUrl: '/' });
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            TuEje
          </h1>
          <p className="text-gray-600 mt-2">Tu tracker de hábitos y finanzas</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* BOTÓN DE GOOGLE (Integrado al diseño) */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 mb-6 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition shadow-sm"
          >
            {/* Usamos el SVG de Google para mejor diseño */}
            <svg className="w-6 h-6" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.56l5.3-5.3c-3.66-3.77-8.88-5.76-14.51-5.76c-11.39 0-21.16 8.35-23.49 19.34h6.02c2.1-7.23 8.3-12.65 17.06-12.65z"/>
              <path fill="#4285F4" d="M46.7 24.5h-2.14c0-.98-.06-1.92-.17-2.85h-20.39v6h11.75c-.56 2.92-2.16 5.37-4.52 7l4.88 4.88c3.57-3.29 5.66-8.22 5.66-14.15z"/>
              <path fill="#FBBC04" d="M9.5 29.5c-.47-1.39-.73-2.9-.73-4.5s.26-3.11.73-4.5v-6.02h-6.02c-.93 1.83-1.48 3.82-1.48 6.52s.55 4.69 1.48 6.52l6.02-6.02z"/>
              <path fill="#34A853" d="M24 43.5c5.56 0 10.42-2.18 14.15-5.66l-4.88-4.88c-2.36 1.63-4.78 2.72-8.32 2.72c-8.76 0-14.96-5.42-17.06-12.65h-6.02c2.33 10.99 12.1 19.34 23.49 19.34z"/>
            </svg>
            Continuar con Google
          </button>
          
          {/* Separador */}
          <div className="relative flex justify-center items-center mb-6">
            <div className="absolute w-full border-t border-gray-300" />
            <span className="relative bg-white px-2 text-sm text-gray-500">o usa tu email</span>
          </div>

          {/* Selector de modo Login/Register */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setIsLoginMode(true);
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                isLoginMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setIsLoginMode(false);
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                !isLoginMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Formulario de Login/Register Local */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Tu nombre"
                  required={!isLoginMode}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={isLoginMode ? 'Tu contraseña' : 'Mínimo 6 caracteres'}
                required
                minLength={isLoginMode ? undefined : 6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando...' : isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>🔒 Los datos se guardan localmente en tu navegador</p>
        </div>
      </div>
    </div>
  );
}