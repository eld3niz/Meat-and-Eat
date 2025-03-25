import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  headerless?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, headerless = false }) => {
  return (
    <div className="layout flex-grow">
      {!headerless && <div className="hidden">Header wird hier nicht mehr angezeigt</div>}
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
