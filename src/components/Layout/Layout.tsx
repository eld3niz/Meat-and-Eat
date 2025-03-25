import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  headerless?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, headerless = false }) => {
  // In der Hauptansicht (mit Karte) soll das Layout die ganze Viewport-Höhe einnehmen
  // und die untergeordneten Elemente sollen entsprechend vertikal angeordnet werden
  return (
    <div className="flex flex-col min-h-screen">
      {!headerless && <Header />}
      <main className={`${!headerless ? 'flex-grow' : ''} flex flex-col`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
