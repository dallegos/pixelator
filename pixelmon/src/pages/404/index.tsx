import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <>
      <h1>Pokemon no encontrado</h1>
      <button
        onClick={() => {
          navigate("/");
        }}
      >
        Go to index
      </button>
    </>
  );
};

export default NotFound;
