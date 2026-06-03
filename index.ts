import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent llama a AppRegistry.registerComponent('main', () => App)
// y asegura que el entorno esté configurado tanto en Expo Go como en build nativo.
registerRootComponent(App);
