import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { createContext, useContext, useState, useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const AdminContext = createContext({ isAdmin: false });
export const useAdmin = () => useContext(AdminContext);

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const password = params.get('admin');
        if (password === process.env.EXPO_PUBLIC_ADMIN_PASSWORD) {
            setIsAdmin(true);
        }
    }, []);

    return (
        <AdminContext.Provider value={{ isAdmin }}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                </Stack>
                <StatusBar style="auto" />
            </ThemeProvider>
        </AdminContext.Provider>
    );
}