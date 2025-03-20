import 'leaflet';

// Extend Leaflet's Icon.Default to include the _getIconUrl property
declare module 'leaflet' {
  namespace Icon {
    namespace Default {
      interface prototype {
        _getIconUrl?: string;
      }
    }
  }
}
