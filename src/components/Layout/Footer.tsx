const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white text-xs p-3 mt-auto">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <p>&copy; {new Date().getFullYear()} Meet and Eat</p>
        
        <div className="mt-2 md:mt-0 flex space-x-4">
          <a href="/datenschutz" className="hover:text-blue-300 transition-colors">Datenschutz</a>
          <a href="/impressum" className="hover:text-blue-300 transition-colors">Impressum</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
