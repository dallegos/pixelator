import { useRef } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";

import NotFound from "./pages/404";
import Inicio from "./pages/Inicio";
import Pixelart from "./pages/Pixelart";

const AnimatedRoutes = () => {
  const location = useLocation();
  const nodeRef = useRef(null);

  return (
    <TransitionGroup component={null}>
      <CSSTransition
        key={location.key}
        classNames="fade"
        timeout={300}
        nodeRef={nodeRef}
      >
        <Routes location={location}>
          <Route path="/" element={<Inicio />} />
          <Route path="/:folder" element={<Inicio />} />
          <Route path="/:folder/:name" element={<Pixelart />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  );
};

function Pixelator() {
  return (
    <>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </>
  );
}

export default Pixelator;
