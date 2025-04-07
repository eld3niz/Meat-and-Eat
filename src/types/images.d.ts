// This declaration tells TypeScript that importing a .png file
// will result in a module whose default export is a string (the path/URL).
declare module '*.png' {
  const value: string;
  export default value;
}