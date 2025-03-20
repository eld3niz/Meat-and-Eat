import React from 'react'

const Header = () => {
  return (
    <header className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Weltkartenansicht</h1>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <a href="#" className="hover:text-gray-200 transition-colors">
                Startseite
              </a>
            </li>
            <li>
              <a href="#about" className="hover:text-gray-200 transition-colors">
                Über
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
