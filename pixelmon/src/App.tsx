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

  return (
    <TransitionGroup component={null}>
      <CSSTransition key={location.key} classNames="fade" timeout={300}>
        <Routes location={location}>
          <Route path="/:folder" element={<Inicio />}></Route>
          <Route path="/:folder/:name" element={<Pixelart />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
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
