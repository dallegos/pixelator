import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

type Props = { pokemon: string; index: number };

const Card = ({ pokemon, index }: Props) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => {
        navigate(`/pokemon/${pokemon}`);
      }}
      key={index}
      className="pokemonCard"
    >
      <img
        alt={`${pokemon}`}
        src={`${process.env.PUBLIC_URL}/img/${pokemon}.png`}
      />
    </div>
  );
};

Card.propTypes = {
  pokemon: PropTypes.string,
  index: PropTypes.number,
};

export default Card;
