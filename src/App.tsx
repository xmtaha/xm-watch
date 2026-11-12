import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import SearchPage from "./pages/Search";
import TitlePage from "./pages/TitlePage";
import Library from "./pages/Library";
import Picker from "./pages/Picker";
import Settings from "./pages/Settings";
import Watch from "./pages/Watch";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    // Hash routing keeps deep links (and reloads) working on static hosts such
    // as GitHub Pages, where there is no server to rewrite unknown paths.
    <HashRouter>
      <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="films" element={<Browse type="movie" />} />
            <Route path="series" element={<Browse type="tv" />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="library" element={<Library />} />
            <Route path="pick" element={<Picker />} />
            <Route path="settings" element={<Settings />} />
            <Route path="title/:type/:id" element={<TitlePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="watch/:type/:id" element={<Watch />} />
        </Routes>
      </ToastProvider>
    </HashRouter>
  );
}