jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: jest.fn().mockImplementation((dir, nome) => ({
    uri: dir + '/' + nome,
    create: jest.fn(),
    write: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'dismiss' }),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { hostUri: '192.168.0.10:8081' } },
}));
