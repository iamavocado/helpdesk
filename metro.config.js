// Configuración por defecto de Metro para Expo.
// Se mantiene explícita para poder extenderla en fases posteriores
// (p. ej. soporte de SQLite/WatermelonDB).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
