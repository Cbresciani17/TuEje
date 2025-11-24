import "./globals.css";
import type { Metadata } from "next";
import Header from "./components/Header";
import { SessionWrapper } from "./providers/SessionWrapper";
import { I18nProvider } from "./lib/i18n";

export const metadata: Metadata = {
  title: "TuEje",
  description: "App personal de hábitos y finanzas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900">
        <SessionWrapper>
          <I18nProvider>
            <Header />
            <main className="max-w-5xl mx-auto px-4 py-6">
              {children}
            </main>
          </I18nProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}



// import "./globals.css";
// import type { Metadata } from "next";
// import Header from "./components/Header";
// import { SessionWrapper } from "./providers/SessionWrapper";
// import { I18nProvider } from "./lib/i18n";

// export const metadata: Metadata = {
//   title: "TuEje",
//   description: "App personal de hábitos y finanzas",
// };

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="es">
//       <body className="bg-gray-50 text-gray-900">
//         <SessionWrapper>
//           <I18nProvider>
//             <Header />
//             <main className="max-w-5xl mx-auto px-4 py-6">
//               {children}
//             </main>
//           </I18nProvider>
//         </SessionWrapper>
//       </body>
//     </html>
//   );
// }





// // import "./globals.css";
// // import type { Metadata } from "next";
// // import Header from "./components/Header";
// // import { SessionWrapper } from "./providers/SessionWrapper";

// // export const metadata: Metadata = {
// //   title: "TuEje",
// //   description: "App personal de hábitos y finanzas",
// // };

// // export default function RootLayout({ children }: { children: React.ReactNode }) {
// //   return (
// //     <html lang="es">
// //       <body className="bg-gray-50 text-gray-900">
// //         <SessionWrapper>
// //           <Header />
// //           {/* 💡 RESTAURACIÓN CLAVE: El tag <main> con las clases de centrado */}
// //           <main className="max-w-5xl mx-auto px-4 py-6">
// //             {children}
// //           </main>
// //         </SessionWrapper>
// //       </body>
// //     </html>
// //   );
// // }