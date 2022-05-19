import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import "./styles.scss";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div id="not-found-container">
      <h1>Pokemon no encontrado</h1>
      <Button
        className="button backButton"
        text="Go back to index"
        onClick={() => {
          navigate("/");
        }}
      />
    </div>
  );
};

export default NotFound;
