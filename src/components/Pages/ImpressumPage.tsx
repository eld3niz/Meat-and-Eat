import React from 'react';

const ImpressumPage: React.FC = () => {
  return (
    <>
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">Impressum</h1>
        
        <div className="prose prose-blue max-w-none">
          <h2>Angaben gemäß § 5 TMG</h2>
          <p>
            Meet and Eat GmbH<br />
            Musterstraße 123<br />
            12345 Musterstadt<br />
            Deutschland
          </p>
          
          <h3>Kontakt</h3>
          <p>
            Telefon: +49 (0) 123 456789<br />
            E-Mail: info@meetandeat.example
          </p>
          
          <h3>Vertreten durch</h3>
          <p>
            Max Mustermann, Geschäftsführer
          </p>
          
          <h3>Handelsregister</h3>
          <p>
            HRB 12345<br />
            Amtsgericht Musterstadt
          </p>
          
          <h3>Umsatzsteuer-ID</h3>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
            DE 123456789
          </p>
          
          <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p>
            Max Mustermann<br />
            Musterstraße 123<br />
            12345 Musterstadt<br />
            Deutschland
          </p>
          
          <h2>Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
              https://ec.europa.eu/consumers/odr/
            </a>
          </p>
          <p>
            Unsere E-Mail-Adresse finden Sie oben im Impressum.
          </p>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
          
          <h2>Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. 
            Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen 
            zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
          <p>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. 
            Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden 
            von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
          </p>
        </div>
      </div>
    </>
  );
};

export default ImpressumPage;
