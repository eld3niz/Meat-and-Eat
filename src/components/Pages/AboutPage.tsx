import React, { useEffect } from 'react';
// import Layout from '../Layout/Layout';

const AboutPage: React.FC = () => {
  // Entferne Scroll-Beschränkungen beim Laden der Seite
  useEffect(() => {
    // Scroll-Verhalten auf 'auto' setzen, um freies Scrollen zu ermöglichen
    document.body.style.overflow = 'auto';
    
    return () => {
      // Stelle das ursprüngliche Scroll-Verhalten wieder her
      document.body.style.overflow = 'hidden';
    };
  }, []);

  return (
    <>
      <div className="bg-gradient-to-b from-blue-50 to-white overflow-auto">
        {/* Hero Section */}
        <section className="pt-20 pb-28 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900 mb-6">
              Entdecke die Welt durch <span className="text-blue-600">gemeinsames Essen</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tauche ein in lokale Kulturen, triff interessante Menschen und schaffe unvergessliche Erinnerungen am Esstisch rund um den Globus.
            </p>
            <div className="mt-8">
              <a 
                href="/" 
                className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium inline-block shadow-lg hover:bg-blue-700 transition-colors mr-4"
              >
                Karte erkunden
              </a>
              {/* Entfernt die onClick-Handler, die Scroll-Navigation erzwingen */}
              <a 
                href="#features" 
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full text-lg font-medium inline-block hover:bg-blue-50 transition-colors"
              >
                Mehr erfahren
              </a>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative h-96 md:h-[500px] rounded-xl overflow-hidden shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070" 
              alt="Menschen genießen gemeinsam eine Mahlzeit" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
              <p className="text-white text-xl md:text-2xl font-medium">Gemeinsame Mahlzeiten verbinden Menschen rund um den Globus</p>
            </div>
          </div>
          
          {/* Verbesserte Scroll-Indikatoren in alle Richtungen */}
          <div className="flex justify-center mt-10">
            <div className="text-blue-600 animate-pulse text-center">
              <p className="text-sm mb-2">Scrolle, um mehr zu entdecken</p>
              <div className="flex justify-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-16">
              Warum mit Locals essen?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Feature 1 */}
              <div className="bg-blue-50 rounded-xl p-8 shadow-md hover:shadow-lg transition transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">Authentische Erfahrungen</h3>
                <p className="text-gray-600">
                  Erlebe die lokale Küche jenseits der Touristenpfade und entdecke Gerichte, die in keinem Reiseführer stehen.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-blue-50 rounded-xl p-8 shadow-md hover:shadow-lg transition transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">Neue Freundschaften</h3>
                <p className="text-gray-600">
                  Knüpfe Verbindungen zu Menschen aus der ganzen Welt und schaffe Freundschaften, die über den Urlaub hinaus bestehen.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-blue-50 rounded-xl p-8 shadow-md hover:shadow-lg transition transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">Kultureller Austausch</h3>
                <p className="text-gray-600">
                  Tauche tief in lokale Kulturen ein, lerne Traditionen und Geschichten kennen, die du sonst nie erfahren würdest.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Photo Gallery Section */}
        <section className="py-16 bg-blue-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-12">
              Kulinarische Eindrücke
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="overflow-hidden rounded-lg h-40 md:h-64">
                <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" alt="Food" className="w-full h-full object-cover transform hover:scale-110 transition duration-500" />
              </div>
              <div className="overflow-hidden rounded-lg h-40 md:h-64">
                <img src="https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" alt="Food" className="w-full h-full object-cover transform hover:scale-110 transition duration-500" />
              </div>
              <div className="overflow-hidden rounded-lg h-40 md:h-64">
                <img src="https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" alt="Food" className="w-full h-full object-cover transform hover:scale-110 transition duration-500" />
              </div>
              <div className="overflow-hidden rounded-lg h-40 md:h-64">
                <img src="https://images.unsplash.com/photo-1547573854-74d2a71d0826?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" alt="Food" className="w-full h-full object-cover transform hover:scale-110 transition duration-500" />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-white">
          {/* Entferne absolute Positionierungen, um freies Scrollen zu verbessern */}
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-16">
              Wie Meet and Eat funktioniert
            </h2>
            
            <div className="relative">
              {/* Verbindungslinie als Hintergrund mit relativer Positionierung */}
              <div className="hidden md:block h-1 bg-blue-200 absolute top-24 left-0 right-0 z-0"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                {/* Step 1 */}
                <div className="text-center bg-white p-4 rounded-lg">
                  <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                  <h3 className="text-xl font-bold text-blue-900 mb-3">Entdecke Städte</h3>
                  <p className="text-gray-600">
                    Erkunde unsere interaktive Karte und finde Städte, die dich interessieren.
                  </p>
                </div>
                
                {/* Step 2 */}
                <div className="text-center bg-white p-4 rounded-lg">
                  <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                  <h3 className="text-xl font-bold text-blue-900 mb-3">Wähle eine Erfahrung</h3>
                  <p className="text-gray-600">
                    Suche nach Essens-Erlebnissen, die zu deinen Vorlieben und Reiseplänen passen.
                  </p>
                </div>
                
                {/* Step 3 */}
                <div className="text-center bg-white p-4 rounded-lg">
                  <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                  <h3 className="text-xl font-bold text-blue-900 mb-3">Triff Locals</h3>
                  <p className="text-gray-600">
                    Verbinde dich mit Einheimischen, die ihre Kultur durch Essen teilen möchten.
                  </p>
                </div>
                
                {/* Step 4 */}
                <div className="text-center bg-white p-4 rounded-lg">
                  <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
                  <h3 className="text-xl font-bold text-blue-900 mb-3">Genieße die Erfahrung</h3>
                  <p className="text-gray-600">
                    Erlebe authentische Küche und schaffe unvergessliche Erinnerungen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-blue-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-16">
              Erfahrungen unserer Community
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-4 flex-shrink-0"> {/* Added fallback bg */}
                    <img 
                      src="/assets/default-avatar.svg" 
                      alt="User Sophia M." 
                      className="w-full h-full object-cover p-1" /* Added padding for SVG */
                    />
                  </div>
                  <div>
                    <p className="font-bold">Sophia M.</p>
                    <p className="text-sm text-gray-500">Berlin, Deutschland</p>
                  </div>
                </div>
                <div className="text-yellow-400 flex mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-600 italic">
                  "In Tokio hatte ich das beste Sushi meines Lebens, zubereitet von einem lokalen Koch, den ich über Meet and Eat kennengelernt habe. Eine unvergessliche Erfahrung!"
                </p>
              </div>
              
              {/* Testimonial 2 */}
              <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-4 flex-shrink-0"> {/* Added fallback bg */}
                    <img 
                      src="/assets/default-avatar.svg" 
                      alt="User David L." 
                      className="w-full h-full object-cover p-1" /* Added padding for SVG */
                    />
                  </div>
                  <div>
                    <p className="font-bold">David L.</p>
                    <p className="text-sm text-gray-500">New York, USA</p>
                  </div>
                </div>
                <div className="text-yellow-400 flex mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-600 italic">
                  "Während meiner Reise durch Südamerika habe ich bei einer Familie in Rio gegessen und so viel mehr über die brasilianische Kultur gelernt, als ich je in einem Restaurant hätte erfahren können."
                </p>
              </div>
              
              {/* Testimonial 3 */}
              <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-4 flex-shrink-0"> {/* Added fallback bg */}
                    <img 
                      src="/assets/default-avatar.svg" 
                      alt="User Aisha K." 
                      className="w-full h-full object-cover p-1" /* Added padding for SVG */
                    />
                  </div>
                  <div>
                    <p className="font-bold">Aisha K.</p>
                    <p className="text-sm text-gray-500">Mumbai, Indien</p>
                  </div>
                </div>
                <div className="text-yellow-400 flex mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-600 italic">
                  "Ich habe neue Freunde in Istanbul gefunden, mit denen ich immer noch in Kontakt bin. Wir haben über dem Essen nicht nur über Kulturen gesprochen, sondern auch tolle Insider-Tipps bekommen."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-16">
              Häufig gestellte Fragen
            </h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-800 mb-2">Ist Meet and Eat überall verfügbar?</h3>
                <p className="text-gray-600">
                  Meet and Eat ist derzeit in über 100 großen Städten weltweit verfügbar. Wir erweitern unser Netzwerk ständig, um noch mehr lokale Essens-Erlebnisse anzubieten.
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-800 mb-2">Wie werden die Gastgeber überprüft?</h3>
                <p className="text-gray-600">
                  Alle Gastgeber durchlaufen einen gründlichen Verifizierungsprozess, einschließlich Identitätsprüfung und Bewertungen früherer Gäste. Sicherheit hat für uns höchste Priorität.
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-800 mb-2">Kann ich auch als Gastgeber teilnehmen?</h3>
                <p className="text-gray-600">
                  Natürlich! Wenn du Reisenden deine lokale Küche und Kultur näherbringen möchtest, kannst du dich ganz einfach als Gastgeber registrieren und dein eigenes kulinarisches Erlebnis anbieten.
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-800 mb-2">Gibt es Diät-Optionen für bestimmte Ernährungsweisen?</h3>
                <p className="text-gray-600">
                  Ja, viele Gastgeber bieten Optionen für vegetarische, vegane, glutenfreie und andere spezielle Ernährungsbedürfnisse an. Diese Informationen findest du in den Details jedes Essens-Erlebnisses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Bereit, die Welt durch Essen zu entdecken?
            </h2>
            <p className="text-xl mb-10 max-w-3xl mx-auto opacity-90">
              Finde lokale Essens-Erlebnisse in den faszinierendsten Städten der Welt und tauche ein in neue Kulturen.
            </p>
            <a href="/" className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-medium inline-block shadow-lg hover:bg-blue-50 transition-colors">
              Jetzt starten
            </a>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutPage;
