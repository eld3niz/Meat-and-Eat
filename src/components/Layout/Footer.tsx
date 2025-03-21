const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white text-xs p-3 mt-auto">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <p>&copy; {new Date().getFullYear()} World Map Project</p>
        
        <div className="mt-2 md:mt-0 flex space-x-4">
          <a href="#" className="hover:text-blue-300 transition-colors">Datenschutz</a>
          <a href="#" className="hover:text-blue-300 transition-colors">Impressum</a>
          <a href="#" className="hover:text-blue-300 transition-colors">Quellen</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
