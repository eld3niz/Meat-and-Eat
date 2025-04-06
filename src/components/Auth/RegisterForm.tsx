import { useState } from 'react';

interface RegisterFormProps {
  onSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};
    
    // Name-Validierung
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    // E-Mail-Validierung
    if (!formData.email) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ungültiges E-Mail-Format';
    }
    
    // Passwort-Validierung
    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }
    
    // Passwort-Bestätigung
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }
    
    // Nutzungsbedingungen
    if (!acceptTerms) {
      newErrors.terms = 'Sie müssen die Nutzungsbedingungen akzeptieren';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Hier würde der tatsächliche Registrierungs-API-Aufruf stattfinden
      // Für jetzt simulieren wir eine Verzögerung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Erfolgreiche Registrierung
      // console.log('Registrierung erfolgreich mit:', formData);
      // onSuccess(); // Prevent closing modal after registration
    } catch (error) {
      // Fehlerbehandlung
      setRegisterError('Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.');
      console.error('Registrierung fehlgeschlagen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="text-xl font-bold mb-6 text-gray-800">Meet and Eat Konto erstellen</h2>
      
      {registerError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md" role="alert">
          {registerError}
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          required
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600" id="name-error">
            {errors.name}
          </p>
        )}
      </div>
      
      <div className="mb-4">
        <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">
          E-Mail
        </label>
        <input
          type="email"
          id="register-email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600" id="email-error">
            {errors.email}
          </p>
        )}
      </div>
      
      <div className="mb-4">
        <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
          Passwort
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="register-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600" id="password-error">
            {errors.password}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Passwort muss mindestens 8 Zeichen lang sein.
        </p>
      </div>
      
      <div className="mb-6">
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
          Passwort bestätigen
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          id="confirm-password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
          }`}
          required
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600" id="confirm-password-error">
            {errors.confirmPassword}
          </p>
        )}
      </div>
      
      <div className="mb-6">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="font-medium text-gray-700">
              Ich akzeptiere die{' '}
              <a href="/datenschutz" className="text-blue-600 hover:underline">
                Nutzungsbedingungen
              </a>{' '}
              und{' '}
              <a href="/datenschutz" className="text-blue-600 hover:underline">
                Datenschutzrichtlinien
              </a>
            </label>
            {errors.terms && (
              <p className="mt-1 text-sm text-red-600">
                {errors.terms}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <button
        type="submit"
        className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          isLoading ? 'opacity-75 cursor-not-allowed' : ''
        }`}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Registrieren...
          </span>
        ) : (
          'Registrieren'
        )}
      </button>
    </form>
  );
};

export default RegisterForm;
