import Constants from 'expo-constants';

function descobrirUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  const host = Constants.expoConfig && Constants.expoConfig.hostUri;
  if (host) {
    return 'http://' + host.split(':')[0] + ':3000';
  }
  return 'http://localhost:3000';
}

export const API_URL = descobrirUrl();
