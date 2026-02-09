import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import CardRegistration from './pages/CardRegistration';
import Reports from './pages/Reports';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="members" element={<Members />} />
                    <Route path="cards" element={<CardRegistration />} />
                    <Route path="reports" element={<Reports />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
