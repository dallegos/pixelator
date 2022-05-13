import { BrowserRouter, Route, Routes } from "react-router-dom";

import Menu from "./components/Menu";
import NotFound from "./pages/404";
import Inicio from "./pages/Inicio";
import Pokemon from "./pages/Pokemon";

function Pixelmon() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/pokemon/:name" element={<Pokemon />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>

      {/* <Menu /> */}
    </>
  );
}

export default Pixelmon;
