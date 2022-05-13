import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";

import Menu from "./components/Menu";
import NotFound from "./pages/404";
import Inicio from "./pages/Inicio";
import Pokemon from "./pages/Pokemon";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <TransitionGroup component={null}>
      <CSSTransition key={location.key} classNames="fade" timeout={300}>
        <Routes location={location}>
          <Route path="/" element={<Inicio />} />
          <Route path="/pokemon/:name" element={<Pokemon />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  );
};

function Pixelmon() {
  return (
    <>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>

      {/* <Menu /> */}
    </>
  );
}

export default Pixelmon;
