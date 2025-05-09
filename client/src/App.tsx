import { RouterProvider } from 'react-router-dom';
import { useAuthInit } from './hooks/init';
import router from './routes/router';
import useAppStore from './store/app';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from 'sonner';
import FullScreenLoader from './pages/LoadingPage';

function App() {
  useAuthInit()

  const hasInit = useAppStore((state) => state.hasInit)


  return <>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {
        hasInit ? <AppContent /> : <FullScreenLoader />
      }
    </ThemeProvider>
  </>
}

function AppContent() {


  return (
    <main className='h-screen w-screen'>
      <Toaster />
      <RouterProvider router={router} />
    </main>
  )
}

export default App
